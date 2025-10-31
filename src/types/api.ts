// Tipos relacionados con APIs y requests/responses

// Tipos para FPL API (alias de los tipos de league para claridad)
export type FplStanding = import('./league').Standing;
export type FplMatch = import('./league').ApiMatch;

// Tipos para requests de API
export interface BetInput {
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  potential_win: number;
}

export interface ResolveRequest {
  gameweek: number;
}

