import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener gameweeks con apuestas (no solo pendientes)
    const { data: gameweeks, error } = await supabase
      .from('bets')
      .select('gameweek, status')
      .order('gameweek', { ascending: true });

    if (error) {
      throw error;
    }

    // Obtener gameweeks únicas
    const uniqueGameweeks = [...new Set(gameweeks?.map(bet => bet.gameweek) || [])];

    // Obtener estadísticas de apuestas por gameweek
    const gameweekStats = await Promise.all(
      uniqueGameweeks.map(async (gameweek) => {
        // Total de apuestas
        const { count: totalBets } = await supabase
          .from('bets')
          .select('*', { count: 'exact', head: true })
          .eq('gameweek', gameweek);
        
        // Apuestas resueltas
        const { count: resolvedBets } = await supabase
          .from('bets')
          .select('*', { count: 'exact', head: true })
          .eq('gameweek', gameweek)
          .eq('status', 'resolved');

        const unresolvedBets = (totalBets || 0) - (resolvedBets || 0);

        return {
          gameweek,
          total_bets: totalBets || 0,
          resolved_bets: resolvedBets || 0,
          unresolved_bets: unresolvedBets,
          can_resolve: unresolvedBets > 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      gameweeks: gameweekStats
    });

  } catch (error) {
    console.error('Error obteniendo gameweeks:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
