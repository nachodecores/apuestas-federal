/**
 * CUSTOM HOOK: useUserStats
 * 
 * PROPÓSITO:
 * Calcula estadísticas del usuario basadas en sus apuestas:
 * - Total ganado (suma de potential_win de apuestas ganadas)
 * - Total perdido (suma de amount de apuestas perdidas)
 * - Ganancia neta (total ganado - total perdido)
 * - Lista de apuestas ganadas
 * - Lista de apuestas perdidas
 * 
 * PARÁMETROS:
 * @param allBets - Array de todas las apuestas del usuario
 * 
 * RETORNA:
 * - totalWon: Total ganado en apuestas
 * - totalLost: Total perdido en apuestas
 * - netProfit: Ganancia neta (puede ser negativa)
 * - wonBets: Array de apuestas ganadas
 * - lostBets: Array de apuestas perdidas
 * 
 * EJEMPLO DE USO:
 * const { totalWon, totalLost, netProfit } = useUserStats(allBets);
 */

import { useMemo } from 'react';

export interface DashboardStats {
  totalWon: number;
  totalLost: number;
  netProfit: number;
  wonBets: any[];
  lostBets: any[];
}

export function useUserStats(allBets: any[]): DashboardStats {
  return useMemo(() => {
    // Filtrar apuestas ganadas y perdidas
    const wonBets = allBets.filter((bet) => bet.status === 'won');
    const lostBets = allBets.filter((bet) => bet.status === 'lost');
    
    // Calcular totales
    const totalWon = wonBets.reduce((sum, bet) => sum + (bet.potential_win || 0), 0);
    const totalLost = lostBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const netProfit = totalWon - totalLost;

    return {
      totalWon,
      totalLost,
      netProfit,
      wonBets,
      lostBets
    };
  }, [allBets]); // Solo recalcular cuando cambien las apuestas
}

