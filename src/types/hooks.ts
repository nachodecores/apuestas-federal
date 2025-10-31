// Tipos para hooks

import type { Bet } from './betting';

export interface DashboardData {
  profile: any | null;
  allBets: Bet[];
  activeBets: Bet[];
  isAdmin: boolean;
  allUsersBets: Bet[];
  allUsersMap: Map<string, { name: string; initials: string }>;
  dataLoading: boolean;
  refreshData: () => Promise<void>;
}

