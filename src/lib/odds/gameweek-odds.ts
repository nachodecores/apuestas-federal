/**
 * GESTIÓN DE ODDS DE GAMEWEEKS - PERSISTENCIA EN BASE DE DATOS
 * 
 * Este archivo maneja la lectura y escritura de odds en Supabase.
 * Es un wrapper (envoltorio) de src/lib/odds-calculator.ts que agrega persistencia.
 * 
 * FUNCIONES:
 * 
 * 1. getGameweekOdds(gameweek)
 *    - Lee las odds guardadas de una gameweek específica desde Supabase
 *    - Usado por: src/app/api/league/route.ts para mostrar odds en la UI
 * 
 * 2. calculateAndSaveGameweekOdds(gameweek)
 *    - Obtiene datos de FPL API
 *    - Calcula odds usando la lógica de odds-calculator.ts
 *    - Guarda los resultados en la tabla gameweek_matches
 *    - Desactiva odds anteriores de esa gameweek (is_active = false)
 *    - Usado por: endpoints de admin para poblar nuevas gameweeks
 * 
 * FLUJO:
 * Admin → API populate-gw → calculateAndSaveGameweekOdds() → Supabase
 * Usuario → API league → getGameweekOdds() → UI
 */

import { createClient } from '@/lib/supabase/server';
import { calculateOdds } from './calculator';
import type { FplStanding, FplMatch } from '@/types';

export async function getGameweekOdds(gameweek: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('gameweek_matches')
    .select('gameweek, league_entry_1, league_entry_2, home_odds, draw_odds, away_odds, is_active')
    .eq('gameweek', gameweek)
    .eq('is_active', true);
  if (error) throw error;
  return data ?? [];
}

export async function calculateAndSaveGameweekOdds(gameweek: number) {
  const supabase = await createClient();

  const res = await fetch('https://draft.premierleague.com/api/league/1651/details');
  if (!res.ok) throw new Error(`FPL fetch failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { standings: FplStanding[]; matches: FplMatch[] };

  const gwMatches = data.matches.filter((m) => m.event === gameweek);
  if (gwMatches.length === 0) return [] as any[];

  const rows = gwMatches.map((m) => {
    const odds = calculateOdds(m.league_entry_1, m.league_entry_2, data.standings, data.matches);
    return {
      gameweek,
      league_entry_1: m.league_entry_1,
      league_entry_2: m.league_entry_2,
      home_odds: odds.home,
      draw_odds: odds.draw,
      away_odds: odds.away,
      is_active: true,
      calculated_at: new Date().toISOString(),
    };
  });

  const { error: deactErr } = await supabase
    .from('gameweek_matches')
    .update({ is_active: false })
    .eq('gameweek', gameweek);
  if (deactErr) throw deactErr;

  const { error: upsertErr } = await supabase
    .from('gameweek_matches')
    .upsert(rows, { onConflict: 'gameweek,league_entry_1,league_entry_2' });
  if (upsertErr) throw upsertErr;

  return rows;
}


