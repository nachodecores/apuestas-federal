import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ResolveRequest {
  gameweek: number;
}

interface Match {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
  started: boolean;
}

interface Bet {
  id: string;
  user_id: string;
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  potential_win: number;
  status: 'pending' | 'won' | 'lost';
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

    console.log(`🎲 Resolviendo apuestas del Gameweek ${gameweek}...`);

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

    console.log(`✅ Encontrados ${finishedMatches.length} partidos finalizados`);

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

    console.log(`📊 Procesando ${pendingBets.length} apuestas pendientes...`);

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
      console.log(`  Partido: ${match.league_entry_1} vs ${match.league_entry_2} → ${result} (${match.league_entry_1_points}-${match.league_entry_2_points})`);
    });

    // 4. Procesar cada apuesta
    let wonCount = 0;
    let lostCount = 0;
    const usersToUpdate = new Map<string, number>(); // user_id → amount to add

    for (const bet of pendingBets) {
      const matchKey = `${bet.match_league_entry_1}-${bet.match_league_entry_2}`;
      const actualResult = resultsMap.get(matchKey);

      if (!actualResult) {
        console.log(`  ⚠️ No se encontró resultado para apuesta ${bet.id}`);
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
          description: `Ganaste apuesta del GW${gameweek}: ${bet.prediction}`,
          related_bet_id: bet.id
        });

        console.log(`  ✓ Usuario ${bet.user_id} ganó $${bet.potential_win}`);
      } else {
        lostCount++;
        console.log(`  ✗ Usuario ${bet.user_id} perdió $${bet.amount}`);
      }
    }

    // 5. Actualizar balances de usuarios ganadores
    for (const [userId, amountToAdd] of usersToUpdate.entries()) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error(`Error al obtener perfil de usuario ${userId}:`, profileError);
        continue;
      }

      const newBalance = profile.balance + amountToAdd;

      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateBalanceError) {
        console.error(`Error al actualizar balance de usuario ${userId}:`, updateBalanceError);
      } else {
        console.log(`  💰 Balance de usuario ${userId} actualizado: $${newBalance.toFixed(2)}`);
      }
    }

    console.log(`🎉 Resolución completada: ${wonCount} ganadas, ${lostCount} perdidas`);

    return NextResponse.json({
      success: true,
      gameweek,
      resolved: wonCount + lostCount,
      won: wonCount,
      lost: lostCount,
      users_updated: usersToUpdate.size
    });

  } catch (error: any) {
    console.error('Error en API route /api/bets/resolve:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

