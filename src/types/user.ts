// Tipos relacionados con usuarios y perfiles
export interface Profile {
  id: string;
  display_name: string;
  email: string;
  is_claimed: boolean;
  fpl_entry_id: number;
  balance?: number;
  team_logo?: string | null;
  role_id: number;
}

export interface Participant {
  name: string;
  teamName: string;
  fpl_entry_id: number;
  team_logo: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  fpl_entry_id: number;
  balance: number;
  team_logo?: string | null;
  role_id: number;
}
