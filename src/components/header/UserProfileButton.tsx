/**
 * COMPONENTE: UserProfileButton
 *
 * PROPÓSITO:
 * Botón del usuario autenticado que muestra avatar, nombre, balance y opciones.
 * Maneja la apertura del dashboard y logout.
 *
 * PROPS:
 * - userName: Nombre del usuario
 * - userTeamName: Nombre del equipo del usuario
 * - userTeamLogo: Logo del equipo del usuario
 * - userBalance: Balance federal del usuario
 * - isAdmin: Si el usuario es administrador
 * - isHome: Si estamos en la página home
 * - isAdminPage: Si estamos en una página de admin
 * - onOpenDashboard: Callback para abrir el dashboard
 * - onLogout: Callback para cerrar sesión
 */

"use client";

import Image from "next/image";
import { UserProfileButtonProps } from "@/types";

export default function UserProfileButton({
  userName,
  userTeamName,
  userTeamLogo,
  userBalance,
  isAdmin,
  isHome,
  isAdminPage,
  onOpenDashboard,
  onLogout,
}: UserProfileButtonProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Avatar + Nombre + Balance (solo en home) */}
      {isHome && (
        <div className="flex items-center gap-2">
          {/* Balance disponible */}
          <div className="hidden min-[768px]:flex flex-col items-end">
            <span className="text-[0.625rem] text-white/70 uppercase tracking-wider">Disponible</span>
            <span className="text-sm font-bold text-[#00ff87]">
              F${userBalance.toFixed(2)}
            </span>
          </div>
          
          {/* Botón al dashboard con avatar */}
          <button
            onClick={onOpenDashboard}
            className="px-2 py-1.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 1)', 
              color: '#37003c' 
            }}
          >
            {/* Texto a la izquierda, alineado a la derecha */}
            <div className="flex flex-col items-end text-right">
              <span className="font-semibold text-[0.625rem] leading-tight">{userName}</span>
              <span className="text-[0.625rem] text-gray-600 leading-tight font-light">{userTeamName}</span>
            </div>
            
            {/* Avatar a la derecha */}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-white/20 flex-shrink-0">
              <Image
                src="/assets/Group170.svg"
                alt={userTeamName}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            </div>
          </button>
        </div>
      )}

      {/* Botón Dashboard (en admin) */}
      {isAdminPage && (
        <button
          onClick={onOpenDashboard}
          className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs font-semibold"
        >
          Dashboard
        </button>
      )}

      {/* Botón Cerrar sesión (en admin) */}
      {isAdminPage && (
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs font-semibold"
        >
          <span className="hidden min-[768px]:inline">Cerrar sesión</span>
          <span className="min-[768px]:hidden">Salir</span>
        </button>
      )}
    </div>
  );
}
