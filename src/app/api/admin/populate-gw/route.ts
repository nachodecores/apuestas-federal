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
 * 4. Desactiva solo gameweeks activas que ya tienen resultado (respetando constraint)
 * 5. Verifica que no queden gameweeks activas sin resultado
 * 6. Inserta/actualiza nueva gameweek con is_active = true
 * 
 * NOTA: Mantiene historial de todas las gameweeks en la DB
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/constants/roles';
import { calculateOdds } from '@/lib/odds/calculator';
import type { FplStanding, FplMatch } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    // Auth y verificación de admin
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();
    const isAdmin = profile?.role_id === ROLES.ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedGw: number | undefined = body?.gameweek;

    const res = await fetch('https://draft.premierleague.com/api/league/1651/details');
    if (!res.ok) {
      throw new Error(`FPL fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { 
      standings: FplStanding[]; 
      matches: FplMatch[] 
    };

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

    // Desactivar solo las gameweeks que están activas Y tienen resultado
    // Esto respeta el constraint check_inactive_must_have_result
    // Usar Service Role para escrituras (bypass RLS)
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceSupabase = createServiceClient();

    const { error: deactivateErr } = await serviceSupabase
      .from('gameweek_matches')
      .update({ is_active: false })
      .eq('is_active', true)
      .not('result', 'is', null);
      
    if (deactivateErr) {
      console.error('Error al desactivar gameweeks anteriores:', deactivateErr);
      throw deactivateErr;
    }

    // Verificar si quedan gameweeks activas sin resultado (no debería pasar si el flujo es correcto)
    const { data: activeWithoutResult, error: checkErr } = await serviceSupabase
      .from('gameweek_matches')
      .select('gameweek')
      .eq('is_active', true)
      .is('result', null)
      .limit(1)
      .maybeSingle();

    if (checkErr) {
      console.warn('Error al verificar gameweeks activas sin resultado:', checkErr);
    }

    if (activeWithoutResult) {
      return NextResponse.json({ 
        success: false, 
        error: `Hay una gameweek activa (GW${activeWithoutResult.gameweek}) sin resolver. Por favor, resuelve la gameweek primero antes de poblar la siguiente.` 
      }, { status: 400 });
    }

    const { error: upsertErr } = await serviceSupabase
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
    const anyErr: any = error;
    const message = anyErr?.message || anyErr?.error || anyErr?.hint || JSON.stringify(anyErr) || 'Unknown error';
    console.error('populate-gw error:', anyErr);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


