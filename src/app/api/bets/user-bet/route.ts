/**
 * ENDPOINT: GET /api/bets/user-bet
 * 
 * PROPÓSITO:
 * Verifica si el usuario ya tiene una apuesta en un partido específico.
 * Previene apuestas duplicadas en el mismo partido.
 * 
 * QUERY PARAMS:
 * - gameweek: number
 * - match_league_entry_1: number
 * - match_league_entry_2: number
 * 
 * RESPUESTAS:
 * - 200: { bet: Bet | null } - Devuelve la apuesta si existe, null si no
 * - 400: Parámetros faltantes
 * - 401: Usuario no autenticado
 * - 500: Error al buscar apuesta
 * 
 * USADO POR:
 * - MatchCard.tsx (para verificar si ya apostó)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');
    const match_league_entry_1 = searchParams.get('match_league_entry_1');
    const match_league_entry_2 = searchParams.get('match_league_entry_2');

    if (!gameweek || !match_league_entry_1 || !match_league_entry_2) {
      return NextResponse.json({ error: 'Parámetros requeridos: gameweek, match_league_entry_1, match_league_entry_2' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: bet, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .eq('gameweek', parseInt(gameweek))
      .eq('match_league_entry_1', parseInt(match_league_entry_1))
      .eq('match_league_entry_2', parseInt(match_league_entry_2))
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ bet: bet || null });

  } catch (error) {
    console.error('Error checking user bet:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
