// Tipos para props de componentes

import type { Participant, Profile } from './user';
import type { User } from '@supabase/supabase-js';

// Header Components
export interface PasswordModalProps {
  isOpen: boolean;
  participant: Participant | null;
  password: string;
  loggingIn: boolean;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loginError?: string | null;
}

export interface AuthButtonProps {
  participants: Participant[];
  loggingIn: boolean;
  onSelectUser: (participant: Participant) => void;
}

export interface UserProfileButtonProps {
  userName: string;
  userTeamName: string;
  userTeamLogo: string | null;
  userBalance: number;
  isAdmin: boolean;
  isHome: boolean;
  isAdminPage: boolean;
  onOpenDashboard: () => void;
  onLogout: () => void;
}

// Dashboard Components
export interface DashboardHeaderProps {
  profile: Profile | any;
  userTeamName: string;
  user: User;
  onClose: () => void;
}

export interface DashboardFooterProps {
  isAdmin: boolean;
  onShowChangePassword: () => void;
  onLogout: () => void;
  onPopulateGameweek: () => void;
}

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DashboardStatsProps {
  activeBets: Array<{ amount: number; [key: string]: any }>;
  netProfit: number;
  federalBalance: number;
}

export interface TeamInfo {
  name: string;
  logo: string | null;
}

export interface UserInfo {
  name: string;
  initials: string;
}

export interface ActiveBetsTableProps {
  activeBets: Array<{
    id: string;
    user_id: string;
    match_league_entry_1: number;
    match_league_entry_2: number;
    prediction: string;
    amount: number;
    odds: number;
    potential_win: number;
    [key: string]: any;
  }>;
  isAdmin: boolean;
  teamMap: Map<number, TeamInfo>;
  allUsersMap: Map<string, UserInfo>;
  onBetDeleted: () => void;
  onClose: () => void;
}

