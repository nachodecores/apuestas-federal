/**
 * ENDPOINT: POST /api/admin/populate-gw
 * 
 * PROPÓSITO:
 * Pobla la tabla gameweek_matches con datos de una nueva gameweek.
 * Obtiene datos de FPL API, calcula odds y guarda en Supabase.
 * 
 * BODY (opcional):
 * {
 *   gameweek?: number  // Si no se provee, usa el próximo gameweek
 * }
 * 
 * RESPUESTAS:
 * - 200: Gameweek poblada exitosamente con cantidad de partidos
 * - 400: No hay partidos para la gameweek solicitada
 * - 500: Error al poblar gameweek
 * 
 * USADO POR:
 * - DashboardModal.tsx (botón de admin)
 * 
 * LÓGICA:
 * 1. Obtiene datos de FPL API (standings, matches)
 * 2. Determina gameweek objetivo (provisto o próximo)
 * 3. Calcula odds para cada partido usando standings y rachas
 * 4. Desactiva TODAS las gameweeks anteriores (is_active = false)
 * 5. Inserta/actualiza nueva gameweek con is_active = true
 * 
 * NOTA: Mantiene historial de todas las gameweeks en la DB
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateOdds } from '@/lib/odds/calculator';

interface FplStanding {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number;
}

interface FplMatch {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const requestedGw: number | undefined = body?.gameweek;

    const res = await fetch('https://draft.premierleague.com/api/league/1651/details');
    if (!res.ok) {
      throw new Error(`FPL fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { standings: FplStanding[]; matches: FplMatch[] };

    let targetGw = requestedGw;
    if (!targetGw) {
      const upcoming = data.matches.filter((m) => !m.finished).sort((a, b) => a.event - b.event);
      if (upcoming.length === 0) {
        return NextResponse.json({ success: false, error: 'No hay próximos partidos.' }, { status: 400 });
      }
      targetGw = upcoming[0].event;
    }

    const gwMatches = data.matches.filter((m) => m.event === targetGw);
    if (gwMatches.length === 0) {
      return NextResponse.json({ success: false, error: `No hay partidos para la GW${targetGw}.` }, { status: 400 });
    }

    const rows = gwMatches.map((m) => {
      const odds = calculateOdds(m.league_entry_1, m.league_entry_2, data.standings, data.matches);
      return {
        gameweek: targetGw!,
        league_entry_1: m.league_entry_1,
        league_entry_2: m.league_entry_2,
        home_odds: odds.home,
        draw_odds: odds.draw,
        away_odds: odds.away,
        is_active: true,
        calculated_at: new Date().toISOString(),
      };
    });

    // Desactivar TODAS las gameweeks existentes (mantener historial)
    const { error: deactivateErr } = await supabase
      .from('gameweek_matches')
      .update({ is_active: false });
    if (deactivateErr) throw deactivateErr;

    const { error: upsertErr } = await supabase
      .from('gameweek_matches')
      .upsert(rows, { onConflict: 'gameweek,league_entry_1,league_entry_2' });
    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      success: true,
      gameweek: targetGw,
      matches: rows.length,
      message: `GW${targetGw} poblada con odds (${rows.length} partidos)`,
    });
  } catch (error) {
    console.error('populate-gw error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


