/**
 * COMPONENTE: ActiveBetsTable
 *
 * PROPÓSITO:
 * Tabla completa con todas las apuestas activas (status='pending').
 * Si es admin, muestra apuestas de todos los usuarios.
 * Si es usuario normal, solo muestra sus apuestas.
 *
 * PROPS:
 * - activeBets: Array de apuestas activas
 * - isAdmin: Si el usuario es admin (para mostrar columna de usuario)
 * - teamMap: Mapa de IDs de equipos → nombres
 * - allUsersMap: Mapa de user_id → info de usuario (iniciales, nombre)
 * - onBetDeleted: Callback cuando se elimina una apuesta
 * - onClose: Función para cerrar el modal (botón "Ver próximos partidos")
 */

"use client";

import DeleteBetButton from "../DeleteBetButton";
import { ActiveBetsTableProps } from "@/types";

export default function ActiveBetsTable({
  activeBets,
  isAdmin,
  teamMap,
  allUsersMap,
  onBetDeleted,
  onClose,
}: ActiveBetsTableProps) {
  if (activeBets.length === 0) {
    return (
      <div
        className="mb-4 sm:mb-6 md:mb-8 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center relative overflow-hidden"
        style={{ backgroundColor: "rgba(237, 237, 237, 0.85)" }}
      >
        <div className="relative z-10">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
            No tenés apuestas activas
          </h3>

          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Andá a la página principal para hacer apuestas en los próximos
            partidos
          </p>

          <button
            onClick={onClose}
            className="inline-block px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity text-white"
            style={{
              background: "linear-gradient(to right, #953bff, #02efff)",
            }}
          >
            Ver próximos partidos
          </button>
        </div>

        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
      </div>
    );
  }

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <h3 className="text-lg sm:text-xl font-black text-[#37003c] mb-3 sm:mb-4">
        {isAdmin ? "Todas las Apuestas Activas" : "Apuestas Activas"}
      </h3>

      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50">
                {isAdmin && (
                  <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                )}
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Partido
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Predicción
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                  Apostado
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                  Posible
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                  Cuota
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-center"></th>
              </tr>
            </thead>

            <tbody>
              {activeBets.map((bet) => {
                const team1 = teamMap.get(bet.match_league_entry_1);
                const team2 = teamMap.get(bet.match_league_entry_2);
                const userInfo = allUsersMap.get(bet.user_id);

                let predictionText = "";
                if (bet.prediction === "home") predictionText = "Local";
                else if (bet.prediction === "away") predictionText = "Visitante";
                else predictionText = "Empate";

                return (
                  <tr
                    key={bet.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Usuario - Solo para admin */}
                    {isAdmin && (
                      <td className="px-2 py-2 sm:px-3 sm:py-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {userInfo?.initials || "N/A"}
                        </div>
                      </td>
                    )}

                    {/* Partido */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {team1?.name || "Local"} vs {team2?.name || "Visitante"}
                      </div>
                    </td>

                    {/* Predicción */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {predictionText}
                      </span>
                    </td>

                    {/* Apostado */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        F${bet.amount ? bet.amount.toFixed(2) : "0.00"}
                      </span>
                    </td>

                    {/* Posible */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        F$
                        {bet.potential_win
                          ? bet.potential_win.toFixed(2)
                          : "0.00"}
                      </span>
                    </td>

                    {/* Cuota */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">
                        {bet.odds ? bet.odds.toFixed(2) : "N/A"}
                      </span>
                    </td>

                    {/* Botón eliminar */}
                    <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                      <DeleteBetButton
                        betId={bet.id}
                        userId={bet.user_id}
                        variant="icon"
                        size="sm"
                        onDeleteSuccess={(betId, refundAmount) => {
                          // Refresh data from parent
                          onBetDeleted();
                        }}
                        onDeleteError={(error) => {
                          console.error("Error deleting bet:", error);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

