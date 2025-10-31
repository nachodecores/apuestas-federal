/**
 * ENDPOINT: POST /api/bets/resolve
 * 
 * PROPÓSITO:
 * Resuelve todas las apuestas de una gameweek usando resultados reales de FPL.
 * Guarda resultados en gameweek_matches para auditoría y futuro uso.
 * 
 * BODY:
 * {
 *   gameweek: number
 * }
 * 
 * RESPUESTAS:
 * - 200: Apuestas resueltas exitosamente con resumen de resultados
 * - 400: Gameweek inválido o no hay partidos finalizados
 * - 401: Usuario no autenticado
 * - 403: Usuario no es admin
 * - 500: Error al resolver apuestas
 * 
 * USADO POR:
 * - Endpoint de admin para resolver gameweeks manualmente
 * - Endpoint de admin/populate-gw para resolver automáticamente
 * 
 * LÓGICA:
 * 1. Verifica que el usuario sea admin
 * 2. Obtiene resultados reales de FPL API
 * 3. Filtra partidos finalizados del gameweek
 * 4. Guarda resultados en gameweek_matches.result y resolved_at
 * 5. Busca apuestas pendientes del gameweek
 * 6. Compara predicciones con resultados
 * 7. Calcula ganadores y perdedores
 * 8. Actualiza balances de usuarios
 * 9. Marca apuestas como resueltas
 * 10. Guarda snapshot de pools en pool_snapshots
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ROLES } from '@/constants/roles';
import type { ResolveRequest, FplMatch } from '@/types';

interface Match extends FplMatch {
  started: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role_id !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Solo administradores pueden resolver gameweeks' }, { status: 403 });
    }

    const { gameweek }: ResolveRequest = await request.json();

    if (!gameweek) {
      return NextResponse.json({ error: 'Gameweek es requerido' }, { status: 400 });
    }


    // 1. Obtener resultados reales de la API de FPL
    const apiResponse = await fetch('https://draft.premierleague.com/api/league/1651/details');
    
    if (!apiResponse.ok) {
      throw new Error('Error al obtener datos de la API de FPL');
    }

    const fplData = await apiResponse.json();
    
    // Filtrar partidos del gameweek que estén finalizados
    const finishedMatches: Match[] = fplData.matches.filter(
      (match: Match) => match.event === gameweek && match.finished
    );

    if (finishedMatches.length === 0) {
      return NextResponse.json({ 
        error: `No hay partidos finalizados en el Gameweek ${gameweek}` 
      }, { status: 400 });
    }

    // 2. Crear mapa de resultados reales y guardar en gameweek_matches
    // IMPORTANTE: Guardar resultados primero, incluso si no hay apuestas pendientes
    const resultsMap = new Map<string, 'home' | 'draw' | 'away'>();
    const resolvedAt = new Date().toISOString();
    
    // Usar Service Role para actualizar gameweek_matches (bypass RLS)
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceSupabase = createServiceClient();
    
    // Calcular y guardar resultados en gameweek_matches
    for (const match of finishedMatches) {
      const key = `${match.league_entry_1}-${match.league_entry_2}`;
      let result: 'home' | 'draw' | 'away';
      
      if (match.league_entry_1_points > match.league_entry_2_points) {
        result = 'home';
      } else if (match.league_entry_1_points < match.league_entry_2_points) {
        result = 'away';
      } else {
        result = 'draw';
      }
      
      resultsMap.set(key, result);
      
      // Guardar resultado en gameweek_matches
      const { error: updateMatchError } = await serviceSupabase
        .from('gameweek_matches')
        .update({ 
          result,
          resolved_at: resolvedAt
        })
        .eq('gameweek', gameweek)
        .eq('league_entry_1', match.league_entry_1)
        .eq('league_entry_2', match.league_entry_2);
      
      if (updateMatchError) {
        console.error(`Error al guardar resultado para partido ${key}:`, updateMatchError);
        // Continuar procesando otros partidos aunque uno falle
      }
    }

    // 3. Obtener todas las apuestas pendientes de ese gameweek
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('gameweek', gameweek)
      .eq('status', 'pending');

    if (betsError) {
      throw new Error(`Error al obtener apuestas: ${betsError.message}`);
    }

    // Si no hay apuestas pendientes, guardar snapshot y retornar
    if (!pendingBets || pendingBets.length === 0) {
      // Guardar snapshot incluso si no hay apuestas
      try {
        const { data: allProfiles } = await serviceSupabase
          .from('profiles')
          .select('federal_balance, real_balance');
        
        const federalAmount = allProfiles?.reduce((sum, profile) => 
          sum + (parseFloat(profile.federal_balance?.toString() || '0')), 0) || 0;
        
        const { data: lastSnapshot } = await serviceSupabase
          .from('pool_snapshots')
          .select('real_amount')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const realAmount = lastSnapshot?.real_amount || 10000;
        
        await serviceSupabase
          .from('pool_snapshots')
          .insert({
            gameweek,
            federal_amount: federalAmount,
            real_amount: realAmount
          });
      } catch (snapshotErr) {
        console.error('Error al guardar snapshot (sin apuestas):', snapshotErr);
      }

      return NextResponse.json({ 
        success: true,
        message: `No hay apuestas pendientes para el Gameweek ${gameweek}`,
        gameweek,
        resolved: 0,
        won: 0,
        lost: 0,
        users_updated: 0,
        matches_updated: finishedMatches.length
      });
    }

    // 4. Procesar cada apuesta
    let wonCount = 0;
    let lostCount = 0;
    const usersToUpdate = new Map<string, number>(); // user_id → amount to add

    for (const bet of pendingBets) {
      const matchKey = `${bet.match_league_entry_1}-${bet.match_league_entry_2}`;
      const actualResult = resultsMap.get(matchKey);

      if (!actualResult) {
        continue;
      }

      const isWinner = bet.prediction === actualResult;
      const newStatus = isWinner ? 'won' : 'lost';

      // Actualizar la apuesta
      const { error: updateError } = await supabase
        .from('bets')
        .update({ status: newStatus })
        .eq('id', bet.id);

      if (updateError) {
        console.error(`Error al actualizar apuesta ${bet.id}:`, updateError);
        continue;
      }

      if (isWinner) {
        wonCount++;
        // Acumular ganancia para el usuario
        const currentAmount = usersToUpdate.get(bet.user_id) || 0;
        usersToUpdate.set(bet.user_id, currentAmount + bet.potential_win);

        // Crear transacción de ganancia
        await supabase.from('transactions').insert({
          user_id: bet.user_id,
          type: 'win',
          amount: bet.potential_win,
          related_bet_id: bet.id
        });

      } else {
        lostCount++;
      }
    }

    // 5. Actualizar balances de usuarios ganadores
    for (const [userId, amountToAdd] of usersToUpdate.entries()) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('federal_balance')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error(`Error al obtener perfil de usuario ${userId}:`, profileError);
        continue;
      }

      const newBalance = profile.federal_balance + amountToAdd;

      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ federal_balance: newBalance })
        .eq('id', userId);

      if (updateBalanceError) {
        console.error(`Error al actualizar balance de usuario ${userId}:`, updateBalanceError);
      } else {
      }
    }

    // 6. Guardar snapshot de pools después de resolver gameweek
    try {
      // Calcular pools actuales
      const { data: allProfiles } = await serviceSupabase
        .from('profiles')
        .select('federal_balance, real_balance');
      
      const federalAmount = allProfiles?.reduce((sum, profile) => 
        sum + (parseFloat(profile.federal_balance?.toString() || '0')), 0) || 0;
      
      // Obtener el real_amount más reciente (o usar el último si alguien actualizó manualmente)
      const { data: lastSnapshot } = await serviceSupabase
        .from('pool_snapshots')
        .select('real_amount')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Usar el último real_amount guardado, o 10000 como fallback
      const realAmount = lastSnapshot?.real_amount || 10000;
      
      // Guardar snapshot
      const { error: snapshotError } = await serviceSupabase
        .from('pool_snapshots')
        .insert({
          gameweek,
          federal_amount: federalAmount,
          real_amount: realAmount  // Este valor se mantiene hasta que se actualice manualmente
        });
      
      if (snapshotError) {
        console.error('Error al guardar snapshot de pools:', snapshotError);
        // No fallar el proceso si el snapshot falla, solo loguear
      } else {
        console.log(`Snapshot de pools guardado para GW${gameweek}: Federal=${federalAmount}, Real=${realAmount}`);
      }
    } catch (snapshotErr) {
      console.error('Error inesperado al guardar snapshot:', snapshotErr);
      // No fallar el proceso completo si hay error en snapshot
    }

    return NextResponse.json({
      success: true,
      gameweek,
      resolved: wonCount + lostCount,
      won: wonCount,
      lost: lostCount,
      users_updated: usersToUpdate.size
    });

  } catch (error) {
    console.error('Error en API route /api/bets/resolve:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

