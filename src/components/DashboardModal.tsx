/**
 * COMPONENTE: DashboardModal
 *
 * PROPÓSITO:
 * Modal principal del dashboard del usuario que orquesta los sub-componentes:
 * - DashboardHeader: Avatar, nombre de usuario y equipo
 * - DashboardStats: Estadísticas de apuestas (activas, apostado, ganancia)
 * - ActiveBetsTable: Tabla de apuestas activas con opción de eliminar
 * - DashboardFooter: Botones de acción (cambiar contraseña, cerrar sesión, admin)
 * - ChangePasswordModal: Modal para cambiar contraseña
 *
 * PROPS:
 * - isOpen: Si el modal está abierto
 * - onClose: Función para cerrar el modal
 * - user: Usuario autenticado de Supabase
 *
 * HOOKS UTILIZADOS:
 * - useDashboardData: Carga perfil, apuestas y detecta admin
 * - useUserStats: Calcular estadísticas de apuestas
 * - useTeamMapping: Mapea IDs de equipos a nombres
 * - useLeague: Obtiene datos de liga (equipos, partidos)
 */

"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useLeague } from "@/contexts/LeagueContext";
import type { User } from "@supabase/supabase-js";
import { DashboardModalProps } from "@/types";
import { useDashboardData, useUserStats, useTeamMapping } from "@/hooks";
import {
  DashboardHeader,
  DashboardStats,
  ActiveBetsTable,
  ChangePasswordModal,
  DashboardFooter,
} from "./dashboard";

export default function DashboardModal({
  isOpen,
  onClose,
  user,
}: DashboardModalProps) {
  const supabase = createClient();
  
  // Usar el contexto de liga para obtener nombres de equipos
  const { getTeamName, isDataLoaded } = useLeague();

  // 🔍 DEBUG: Logs para debuggear el problema del profile
  console.log('🔍 DashboardModal - user:', user);
  console.log('🔍 DashboardModal - isOpen:', isOpen);
  
  // HOOK 1: Cargar datos del dashboard (perfil, apuestas, admin status)
  const {
    profile,
    allBets,
    activeBets,
    isAdmin,
    allUsersBets,
    allUsersMap,
    dataLoading,
    refreshData,
  } = useDashboardData(user, isOpen);
  
  // 🔍 DEBUG: Logs después de usar el hook
  console.log('🔍 DashboardModal - profile después del hook:', profile);
  console.log('🔍 DashboardModal - dataLoading:', dataLoading);

  // HOOK 2: Calcular estadísticas de apuestas
  const stats = useUserStats(allBets);

  // HOOK 3: Mapear IDs de equipos a nombres
  const teamMap = useTeamMapping(activeBets, getTeamName, isDataLoaded);

  // Estados locales (solo para UI)
  const [userTeamName, setUserTeamName] = useState<string>("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Obtener nombre del equipo del usuario cuando se carga el perfil
  useEffect(() => {
    if (profile?.fpl_entry_id && isDataLoaded) {
      const teamName = getTeamName(profile.fpl_entry_id);
          setUserTeamName(teamName);
        }
  }, [profile, isDataLoaded, getTeamName]);

  // Función para cerrar sesión
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      onClose(); // Cerrar el modal
      // El Header se encargará de redirigir o actualizar la UI
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión. Intentalo de nuevo.");
    }
  }

  // Función para poblar gameweek (admin)
  async function handlePopulateGameweek() {
    try {
      const res = await fetch("/api/admin/populate-gw", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al poblar GW");
      // Opcional: mostrar mensaje de éxito
    } catch (e) {
      console.error(e);
      // Opcional: mostrar mensaje de error
    }
  }

  // Cerrar modal con ESC
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-start justify-center z-[9999] p-4 pt-8"
      onClick={onClose}
    >
        <div 
          className="rounded-lg sm:rounded-xl overflow-hidden flex flex-col w-full max-w-6xl relative"
          style={{
          height: "80vh",
          maxHeight: "80vh",
          marginTop: "2rem",
            background: `
              linear-gradient(rgba(255, 255, 255, 0) 240px, white 360px), 
              linear-gradient(to right, rgb(2, 239, 255), rgb(98, 123, 255))
            `,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar - Esquina superior derecha */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-black hover:text-gray-700 transition-colors text-3xl font-bold"
          >
            ×
          </button>

          {/* Header del modal */}
        <DashboardHeader
          profile={profile}
          userTeamName={userTeamName}
          user={user}
          onClose={onClose}
        />

        {/* Contenido del modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 text-lg">Cargando dashboard...</div>
            </div>
          ) : (
            <>
              {/* Stats unificadas */}
              <DashboardStats
                activeBets={activeBets}
                netProfit={stats.netProfit}
              />

              {/* Apuestas activas */}
              <ActiveBetsTable
                activeBets={activeBets}
                isAdmin={isAdmin}
                teamMap={teamMap}
                allUsersMap={allUsersMap}
                onBetDeleted={refreshData}
                onClose={onClose}
              />

              {/* Footer con botones */}
              <DashboardFooter
                isAdmin={isAdmin}
                onShowChangePassword={() => setShowChangePasswordModal(true)}
                onLogout={handleLogout}
                onPopulateGameweek={handlePopulateGameweek}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
