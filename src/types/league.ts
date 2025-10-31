// Tipos relacionados con la liga de FPL
export interface LeagueEntry {
  entry_id: number;
  entry_name: string;
  id: number;
  player_first_name: string;
  player_last_name: string;
  short_name: string;
  total?: number; // Puntos totales FPL (opcional, puede venir en el objeto)
}

export interface Standing {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number; // Puntos totales en la tabla H2H
}

export interface ApiMatch {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
}

export interface DraftLeagueData {
  league: {
    name: string;
  };
  league_entries: LeagueEntry[];
  standings: Standing[];
  matches: ApiMatch[];
}

// Tipo para mostrar en la tabla (datos ya procesados)
export interface PlayerDisplay {
  position: number;
  name: string;
  teamName: string;
  h2hPoints: number; // Puntos de la tabla H2H
  fplPoints: number; // Puntos totales FPL
  record: string; // ej: "6-1-0" (ganados-empatados-perdidos)
  matches_won: number; // Victorias
  matches_drawn: number; // Empates
  matches_lost: number; // Derrotas
  federal_balance: number;
  recentForm: ('win' | 'draw' | 'loss')[]; // Últimos 5 resultados
}

// Tipo para mostrar en las cards de partidos
export interface MatchDisplay {
  gameweek: number;
  team1Name: string;
  team2Name: string;
  team1Manager: string;
  team2Manager: string;
  team1Logo: string | null;
  team2Logo: string | null;
  league_entry_1: number;
  league_entry_2: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

// Tipos para props de componentes
export interface MatchCardProps {
  match: MatchDisplay;
  matchIndex: number;
  user: any; // User de Supabase
  userBalance: number;
  onBetConfirmed: (newBalance: number) => void;
  userBet?: any; // Apuesta existente del usuario para este partido (opcional)
}

export interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // User de Supabase
}
