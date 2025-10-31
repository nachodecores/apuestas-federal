/**
 * COMPONENTE: DashboardFooter
 *
 * PROPÓSITO:
 * Footer del dashboard con botones de acción:
 * - Cambiar contraseña
 * - Cerrar sesión
 * - Poblar próxima GW con odds (solo admin)
 *
 * PROPS:
 * - isAdmin: Si el usuario es admin
 * - onShowChangePassword: Función para mostrar modal de cambio de contraseña
 * - onLogout: Función para cerrar sesión
 * - onPopulateGameweek: Función para poblar próximo gameweek (admin)
 */

"use client";

import { DashboardFooterProps } from "@/types";

export default function DashboardFooter({
  isAdmin,
  onShowChangePassword,
  onLogout,
  onPopulateGameweek,
}: DashboardFooterProps) {
  return (
    <div className="text-center mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
      <button
        onClick={onShowChangePassword}
        className="text-gray-500 hover:text-[#ff2882] transition-colors text-sm font-medium"
      >
        Cambiar contraseña
      </button>

      <button
        onClick={onLogout}
        className="text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
      >
        Cerrar sesión
      </button>

      {isAdmin && (
        <button
          onClick={onPopulateGameweek}
          className="px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-[#02efff] to-[#00ff87] hover:opacity-90 transition-opacity text-sm"
        >
          Resolver Gameweek
        </button>
      )}
    </div>
  );
}

