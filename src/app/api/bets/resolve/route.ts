/**
 * ENDPOINT: POST /api/bets/resolve
 * 
 * PROPÓSITO:
 * Resuelve todas las apuestas de una gameweek usando resultados reales de FPL.
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
 * - 500: Error al resolver apuestas
 * 
 * USADO POR:
 * - Endpoint de admin (futuro) para resolver gameweeks
 * 
 * LÓGICA:
 * 1. Obtiene resultados reales de FPL API
 * 2. Filtra partidos finalizados del gameweek
 * 3. Busca apuestas pendientes del gameweek
 * 4. Compara predicciones con resultados
 * 5. Calcula ganadores y perdedores
 * 6. Actualiza balances de usuarios
 * 7. Marca apuestas como resueltas
 * 
 * TODO: Agregar verificación de admin
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ResolveRequest, FplMatch } from '@/types';

interface Match extends FplMatch {
  started: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación (opcional: agregar verificación de admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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


    // 2. Obtener todas las apuestas pendientes de ese gameweek
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('gameweek', gameweek)
      .eq('status', 'pending');

    if (betsError) {
      throw new Error(`Error al obtener apuestas: ${betsError.message}`);
    }

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({ 
        message: `No hay apuestas pendientes para el Gameweek ${gameweek}`,
        resolved: 0
      });
    }


    // 3. Crear mapa de resultados reales
    const resultsMap = new Map<string, 'home' | 'draw' | 'away'>();
    
    finishedMatches.forEach((match) => {
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
    });

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

