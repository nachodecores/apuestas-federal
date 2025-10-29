/**
 * ENDPOINT: GET /api/bets/user-bets
 * 
 * PROPÓSITO:
 * Obtiene TODAS las apuestas del usuario para un gameweek específico.
 * Optimización para evitar múltiples llamadas individuales.
 * 
 * QUERY PARAMS:
 * - gameweek: number
 * 
 * RESPUESTAS:
 * - 200: { bets: Bet[] } - Array de todas las apuestas del usuario para el gameweek
 * - 400: Parámetros faltantes
 * - 401: Usuario no autenticado
 * - 500: Error al buscar apuestas
 * 
 * USADO POR:
 * - UpcomingMatches.tsx (para cargar todas las apuestas de una vez)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');

    if (!gameweek) {
      return NextResponse.json({ error: 'Parámetro requerido: gameweek' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .eq('gameweek', parseInt(gameweek))
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ bets: bets || [] });

  } catch (error) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
