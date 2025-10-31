/**
 * COMPONENTE: DashboardHeader
 *
 * PROPÓSITO:
 * Cabecera del dashboard con avatar, nombre del usuario y su equipo.
 *
 * PROPS:
 * - profile: Datos del perfil del usuario (nombre, logo)
 * - userTeamName: Nombre del equipo FPL del usuario
 * - user: Usuario autenticado de Supabase (fallback para email)
 * - onClose: Función para cerrar el modal
 */

"use client";

import Image from "next/image";
import { DashboardHeaderProps } from "@/types";

export default function DashboardHeader({
  profile,
  userTeamName,
  user,
  onClose,
}: DashboardHeaderProps) {
  
  return (
    <div className="relative overflow-hidden flex items-center p-4 sm:p-6 border-b border-gray-200">
      {/* Pattern overlay - pattern-2.png alineado a la derecha */}
      <div 
        className="absolute right-0 top-0 h-full w-1/4 sm:w-1/3 md:w-2/5 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/pattern-2.png)',
          backgroundPosition: 'right top',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundAttachment: 'local',
          marginRight: '-20px',
          marginTop: '-5%'
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'url(/assets/pattern-2.png)',
            backgroundPosition: 'right top',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            marginRight: '-20px'
          }}
        />
      </div>
      <div className="relative flex items-center gap-4 z-10">
        {/* Avatar del equipo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white flex-shrink-0">
          {profile?.team_logo ? (
            <Image
              src={`/assets/${profile.team_logo}`}
              alt={profile.display_name || "Equipo"}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
              {profile?.display_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "CC"}
            </div>
          )}
        </div>

        {/* Información del manager */}
        <div className="flex flex-col" style={{ alignItems: "flex-start" }}>
          <div
            className="text-xs uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-b inline-block"
            style={{
              backgroundColor: "#37003c",
              color: "#05f0ff",
              width: "fit-content",
            }}
          >
            CCP
          </div>

          <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {profile?.display_name || user?.email || "Manager"}
          </div>

          <div className="text-xs sm:text-sm text-gray-600">
            {userTeamName || "Equipo"}
          </div>
        </div>
      </div>
    </div>
  );
}

