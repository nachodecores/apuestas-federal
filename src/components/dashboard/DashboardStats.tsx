/**
 * COMPONENTE: DashboardStats
 *
 * PROPÓSITO:
 * Tarjeta con 3 estadísticas principales del usuario:
 * - Apuestas activas
 * - Total apostado
 * - Ganancia potencial
 *
 * PROPS:
 * - activeBets: Array de apuestas activas (status='pending')
 * - netProfit: Ganancia neta calculada
 */

"use client";

interface Bet {
  amount: number;
  [key: string]: any;
}

interface DashboardStatsProps {
  activeBets: Bet[];
  netProfit: number;
}

export default function DashboardStats({
  activeBets,
  netProfit,
}: DashboardStatsProps) {
  const totalBet = activeBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);

  return (
    <div
      className="border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 relative overflow-hidden flex flex-row items-center justify-between"
      style={{ backgroundColor: "rgba(237, 237, 237, 0.85)" }}
    >
      <div className="relative z-10 flex-1 text-center">
        <div className="text-xs text-gray-600 mb-1">Apuestas activas</div>
        <div className="text-lg text-gray-900">{activeBets.length}</div>
      </div>

      <div
        className="w-px h-12"
        style={{ backgroundColor: "rgb(20, 198, 236)" }}
      ></div>

      <div className="relative z-10 flex-1 text-center">
        <div className="text-xs text-gray-600 mb-1">Total apostado</div>
        <div className="text-lg text-gray-900">F${totalBet.toFixed(0)}</div>
      </div>

      <div
        className="w-px h-12"
        style={{ backgroundColor: "rgb(20, 198, 236)" }}
      ></div>

      <div className="relative z-10 flex-1 text-center">
        <div className="text-xs text-gray-600 mb-1">Ganancia potencial</div>
        <div className="text-lg text-gray-900">F${netProfit.toFixed(2)}</div>
      </div>

      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
    </div>
  );
}

