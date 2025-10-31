// Tipos para contextos

import type { User } from '@supabase/supabase-js';
import type { LeagueEntry, Standing, ApiMatch } from './league';

export interface UserProfile {
  id: string;
  display_name: string | null;
  team_logo: string | null;
  fpl_entry_id: number | null;
  federal_balance: number;
  real_balance: number | null;
  role_id: number | null;
}

export interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  federalBalance: number;
  realBalance: number | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export interface LeagueData {
  league_entries: LeagueEntry[];
  standings: Standing[];
  matches: ApiMatch[];
  gameweek?: number;
}

export interface LeagueContextType {
  leagueData: LeagueData | null;
  loading: boolean;
  error: string | null;
  fetchLeagueData: () => Promise<void>;
  getTeamName: (leagueEntryId: number) => string;
  getPlayerName: (leagueEntryId: number) => string;
  isDataLoaded: boolean;
}

