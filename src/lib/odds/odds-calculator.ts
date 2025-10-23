import { createClient } from '@/lib/supabase/server';
import { calculateOdds } from '@/lib/odds-calculator';

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


