import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateSimulatedResults } from '@/lib/simulation/result-generator';
import { resolveGameweekBets, ResolutionSummary } from '@/lib/resolution/bet-resolver';
import { calculateAndSaveGameweekOdds } from '@/lib/odds/odds-calculator';

export async function POST(request: Request) {
  try {
    const { gameweek } = await request.json();
    
    if (!gameweek) {
      return NextResponse.json({ error: 'Gameweek es requerida' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Obtener TODAS las apuestas de la gameweek (no solo pendientes)
    // En el nuevo sistema, todas las apuestas se resuelven al final de cada gameweek
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        prediction,
        amount,
        odds,
        match_league_entry_1,
        match_league_entry_2,
        status
      `)
      .eq('gameweek', gameweek);

    if (betsError) {
      throw betsError;
    }

    if (!bets || bets.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No hay apuestas en la gameweek ${gameweek}`,
        resolution: {
          total_bets: 0,
          winning_bets: 0,
          losing_bets: 0,
          total_payout: 0,
          total_profit_loss: 0,
          bet_resolutions: []
        }
      });
    }

    // Filtrar solo apuestas que no han sido resueltas
    const unresolvedBets = bets.filter(bet => bet.status !== 'resolved');
    
    if (unresolvedBets.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Todas las apuestas de la gameweek ${gameweek} ya han sido resueltas`,
        resolution: {
          total_bets: 0,
          winning_bets: 0,
          losing_bets: 0,
          total_payout: 0,
          total_profit_loss: 0,
          bet_resolutions: []
        }
      });
    }

    // 2. Obtener partidos únicos de las apuestas no resueltas
    const uniqueMatches = new Map();
    unresolvedBets.forEach(bet => {
      const key = `${bet.match_league_entry_1}_vs_${bet.match_league_entry_2}`;
      if (!uniqueMatches.has(key)) {
        uniqueMatches.set(key, {
          league_entry_1: bet.match_league_entry_1,
          league_entry_2: bet.match_league_entry_2,
          odds: {
            home: bet.odds,
            draw: bet.odds * 1.2, // Simular odds de empate
            away: bet.odds * 0.8  // Simular odds de visitante
          }
        });
      }
    });

    const matches = Array.from(uniqueMatches.values());

    // 3. SIMULACIÓN: Generar resultados basados en odds
    const simulatedResults = generateSimulatedResults(matches);

    // 4. Resolver apuestas con resultados simulados
    const resolution = resolveGameweekBets(unresolvedBets, simulatedResults);

    // 5. Actualizar balances de usuarios
    const balanceUpdates = new Map();
    resolution.bet_resolutions.forEach(resolution => {
      if (!balanceUpdates.has(resolution.user_id)) {
        balanceUpdates.set(resolution.user_id, 0);
      }
      balanceUpdates.set(
        resolution.user_id, 
        balanceUpdates.get(resolution.user_id) + resolution.profit_loss
      );
    });

    // 6. Aplicar actualizaciones de balance
    for (const [userId, balanceChange] of balanceUpdates) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('federal_balance')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error(`Error obteniendo balance para usuario ${userId}:`, profileError);
        continue;
      }

      const newBalance = profile.federal_balance + balanceChange;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ federal_balance: newBalance })
        .eq('id', userId);

      if (updateError) {
        console.error(`Error actualizando balance para usuario ${userId}:`, updateError);
      }
    }

    // 7. Marcar apuestas como resueltas
    const betIds = unresolvedBets.map(bet => bet.id);
    const { error: updateBetsError } = await supabase
      .from('bets')
      .update({ status: 'resolved' })
      .in('id', betIds);

    if (updateBetsError) {
      console.error('Error marcando apuestas como resueltas:', updateBetsError);
    }

    // 8. Calcular odds para el próximo gameweek
    let nextGameweekOdds = null;
    try {
      nextGameweekOdds = await calculateAndSaveGameweekOdds(gameweek + 1);
    } catch (oddsError) {
      console.error(`⚠️ Error calculando odds para GW${gameweek + 1}:`, oddsError);
      // No fallar la resolución por error en odds
    }

    return NextResponse.json({
      success: true,
      message: `Gameweek ${gameweek} resuelta exitosamente`,
      gameweek,
      simulated_results: simulatedResults,
      resolution,
      balance_updates: Array.from(balanceUpdates.entries()).map(([userId, change]) => ({
        user_id: userId,
        balance_change: change
      })),
      next_gameweek_odds: nextGameweekOdds ? {
        gameweek: gameweek + 1,
        odds_count: nextGameweekOdds.length,
        calculated: true
      } : {
        gameweek: gameweek + 1,
        odds_count: 0,
        calculated: false,
        error: 'No se pudieron calcular las odds del próximo gameweek'
      }
    });

  } catch (error) {
    console.error('Error en simulación y resolución:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
