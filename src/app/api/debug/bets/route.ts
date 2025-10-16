import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener todas las apuestas agrupadas por gameweek
    const { data: bets, error } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        gameweek,
        match_league_entry_1,
        match_league_entry_2,
        amount,
        odds,
        prediction,
        status,
        created_at
      `)
      .order('gameweek', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Agrupar por gameweek
    const betsByGameweek = bets?.reduce((acc, bet) => {
      const gw = bet.gameweek;
      if (!acc[gw]) {
        acc[gw] = {
          gameweek: gw,
          total_bets: 0,
          pending_bets: 0,
          resolved_bets: 0,
          total_amount: 0,
          bets: []
        };
      }
      
      acc[gw].total_bets++;
      acc[gw].total_amount += bet.amount;
      
      if (bet.status === 'pending') {
        acc[gw].pending_bets++;
      } else if (bet.status === 'resolved') {
        acc[gw].resolved_bets++;
      }
      
      acc[gw].bets.push(bet);
      
      return acc;
    }, {} as Record<number, any>) || {};

    const gameweeks = Object.values(betsByGameweek);

    return NextResponse.json({
      success: true,
      total_bets: bets?.length || 0,
      gameweeks: gameweeks,
      summary: gameweeks.map(gw => ({
        gameweek: gw.gameweek,
        total_bets: gw.total_bets,
        pending_bets: gw.pending_bets,
        resolved_bets: gw.resolved_bets,
        total_amount: gw.total_amount,
        can_simulate: gw.pending_bets > 0
      }))
    });

  } catch (error) {
    console.error('Error obteniendo apuestas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


