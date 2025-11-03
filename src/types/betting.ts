// Tipos relacionados con apuestas
export interface Bet {
  id: string;
  user_id: string;
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  amount: number;
  prediction: 'home' | 'draw' | 'away';
  odds: number;
  potential_win: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
  // selected_team se mantiene por compatibilidad pero puede estar deprecado
  selected_team?: number;
}

export interface UserBet {
  id: number;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  potential_win: number;
}

export interface BetStats {
  totalBets: number;
  totalAmount: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  netGain: number;
}

// Tipos para selección de apuestas
export interface BetSelection {
  prediction: 'home' | 'draw' | 'away' | null;
  amount: string;
}

// Tipos para estadísticas del dashboard
export interface DashboardStats {
  totalWon: number;
  totalLost: number;
  netProfit: number;
  wonBets: any[];
  lostBets: any[];
}

// Tipos para el botón de eliminar apuesta
export interface DeleteBetButtonProps {
  betId: string;
  userId?: string; // For admin to delete other users' bets
  onDeleteSuccess?: (betId: string, refundAmount: number) => void;
  onDeleteError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
  deadlinePassed?: boolean; // Si el deadline pasó, ocultar el botón
}
