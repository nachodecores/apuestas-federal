import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { calculateOdds } from '../../lib/odds-calculator';

type FplStanding = {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number;
};

type FplMatch = {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const supabase = createClient(
  requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
);

async function fetchLeagueDetails() {
  const res = await fetch('https://draft.premierleague.com/api/league/1651/details');
  if (!res.ok) {
    throw new Error(`FPL fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<{ standings: FplStanding[]; matches: FplMatch[] }>;
}

async function main() {
  const argGw = Number(process.argv[2]);

  const data = await fetchLeagueDetails();

  let targetGw = Number.isFinite(argGw) && argGw > 0 ? argGw : undefined;
  if (!targetGw) {
    const upcoming = data.matches.filter((m) => !m.finished).sort((a, b) => a.event - b.event);
    if (upcoming.length === 0) throw new Error('No hay próximos partidos para poblar.');
    targetGw = upcoming[0].event;
  }

  const gwMatches = data.matches.filter((m) => m.event === targetGw);
  if (gwMatches.length === 0) throw new Error(`No hay partidos para la GW${targetGw}.`);

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

  const { error: deactivateErr } = await supabase
    .from('gameweek_matches')
    .update({ is_active: false })
    .eq('gameweek', targetGw);
  if (deactivateErr) throw deactivateErr;

  const { error: upsertErr } = await supabase
    .from('gameweek_matches')
    .upsert(rows, { onConflict: 'gameweek,league_entry_1,league_entry_2' });
  if (upsertErr) throw upsertErr;

  console.log(`✔ GW${targetGw} poblada: ${rows.length} partidos con odds.`);
}

main().catch((e) => {
  console.error('✗ Error:', e instanceof Error ? e.message : e);
  process.exit(1);
});


