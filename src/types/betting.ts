// Tipos relacionados con apuestas
export interface Bet {
  id: string;
  user_id: string;
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  amount: number;
  selected_team: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface UserBet {
  id: string;
  amount: number;
  selected_team: number;
  status: string;
}

export interface BetStats {
  totalBets: number;
  totalAmount: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  netGain: number;
}
