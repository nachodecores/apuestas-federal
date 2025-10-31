"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import DashboardModal from "./DashboardModal";
import { useLeague } from "@/contexts/LeagueContext";
import type { User } from "@supabase/supabase-js";
import { Participant } from "@/types";
import { ROLES } from "@/constants/roles";
import { AuthButton, UserProfileButton, PasswordModal } from "./header/index";
import { useUser } from "@/contexts/UserContext";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Usar contexto global de usuario
  const { user, profile, federalBalance, isAdmin } = useUser();
  const userName = profile?.display_name ?? '';
  const userFplEntryId = profile?.fpl_entry_id ?? null;
  const userTeamLogo = profile?.team_logo ?? null;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [password, setPassword] = useState('');
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const supabase = createClient();
  
  // Usar el contexto de liga
  const { getTeamName, fetchLeagueData, isDataLoaded } = useLeague();

  // Función para cargar participantes (definida fuera del useEffect)
  const loadParticipants = useCallback(async () => {
    try {
      // 1. Primero esperar a que el contexto tenga datos
      if (!isDataLoaded) {
        return; // Salir si no hay datos aún
      }
      
      const response = await fetch('/api/participants');
      const data = await response.json();
      
      if (data.profiles) {
        // Obtener nombres de equipos usando el contexto
        const participantsData: Participant[] = data.profiles.map((profile: { display_name: string; fpl_entry_id: number; team_logo: string | null }) => {
          const teamName = getTeamName(profile.fpl_entry_id);
          
          return {
            name: profile.display_name,
            teamName: teamName,
            fpl_entry_id: profile.fpl_entry_id,
            team_logo: profile.team_logo
          };
        });
        
        setParticipants(participantsData);
      } else {
        // Usar datos por defecto si no hay perfiles
        setParticipants([
          { name: 'Chacho Bonino', teamName: 'Quebracho', fpl_entry_id: 6753, team_logo: null },
          { name: 'Marcos Arocena', teamName: 'Tranqueras', fpl_entry_id: 5156, team_logo: null },
          { name: 'Ignacio de Cores', teamName: 'CA Tambores RF', fpl_entry_id: 38904, team_logo: null },
          { name: 'Manuel Domenech', teamName: 'Sportivo Nico Perez', fpl_entry_id: 44346, team_logo: null },
          { name: 'Juan Dehl', teamName: 'CA Tres Islas', fpl_entry_id: 54556, team_logo: null },
          { name: 'Juan Francisco Sienra', teamName: 'Palmitas City', fpl_entry_id: 5769, team_logo: null },
          { name: 'Felipe Migues', teamName: 'Migues', fpl_entry_id: 5997, team_logo: null },
          { name: 'Joaquin Sarachaga', teamName: 'Deportivo Sauce', fpl_entry_id: 6494, team_logo: null },
          { name: 'Javier Villaamil', teamName: 'Mal Abrigo Town', fpl_entry_id: 6479, team_logo: null },
          { name: 'Ángel Cal', teamName: 'Pirarajá United', fpl_entry_id: 5865, team_logo: null },
        ]);
      }
    } catch (error) {
      // Usar datos por defecto si falla
      setParticipants([
        { name: 'Chacho Bonino', teamName: 'Quebracho', fpl_entry_id: 6753, team_logo: null },
        { name: 'Marcos Arocena', teamName: 'Tranqueras', fpl_entry_id: 5156, team_logo: null },
        { name: 'Ignacio de Cores', teamName: 'CA Tambores RF', fpl_entry_id: 38904, team_logo: null },
        { name: 'Manuel Domenech', teamName: 'Sportivo Nico Perez', fpl_entry_id: 44346, team_logo: null },
        { name: 'Juan Dehl', teamName: 'CA Tres Islas', fpl_entry_id: 54556, team_logo: null },
        { name: 'Juan Francisco Sienra', teamName: 'Palmitas City', fpl_entry_id: 5769, team_logo: null },
        { name: 'Felipe Migues', teamName: 'Migues', fpl_entry_id: 5997, team_logo: null },
        { name: 'Joaquin Sarachaga', teamName: 'Deportivo Sauce', fpl_entry_id: 6494, team_logo: null },
        { name: 'Javier Villaamil', teamName: 'Mal Abrigo Town', fpl_entry_id: 6479, team_logo: null },
        { name: 'Ángel Cal', teamName: 'Pirarajá United', fpl_entry_id: 5865, team_logo: null },
      ]);
    }
  }, [isDataLoaded, getTeamName]);

  useEffect(() => {
    // Solo cargar participantes cuando los datos de liga estén listos
    (async () => {
        await loadParticipants();
        setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar participantes cuando los datos de liga estén disponibles
  useEffect(() => {
    if (isDataLoaded) {
      loadParticipants();
    }
  }, [isDataLoaded, getTeamName]);



  // Mostrar modal de contraseña al seleccionar usuario
  function handleSelectUser(participant: Participant) {
    setSelectedParticipant(participant);
    setShowPasswordModal(true);
    setPassword('');
  }

  // Login con validación de contraseña
  async function handleLoginWithPassword() {
    setLoginError(null);
    
    if (!selectedParticipant) {
      return;
    }
    
    setLoggingIn(true);
    
    try {
      const email = `${selectedParticipant.fpl_entry_id}@bolichefederal.com`;
      
      // Iniciar login y manejar resultado de forma sincrónica
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        const msg = error.message || '';
        if (/Invalid login credentials/i.test(msg)) {
          setLoginError('Credenciales incorrectas. Revisá la contraseña o intentá nuevamente.');
        } else if (/Too many requests/i.test(msg)) {
          setLoginError('Demasiados intentos. Esperá un momento e intentá de nuevo.');
        } else if (/Email not confirmed/i.test(msg)) {
          setLoginError('Email no confirmado. Contactá al administrador.');
        } else {
          setLoginError('No pudimos iniciar sesión. Intentá de nuevo.');
        }
        setLoggingIn(false);
        return;
      }

      // Éxito: cerrar el modal
      setShowPasswordModal(false);
      setSelectedParticipant(null);
      setPassword('');
      setLoggingIn(false);
      // NO redirigimos al dashboard, el usuario se queda en la página actual
      // El Header se actualiza automáticamente mostrando el botón "Dashboard"
    } catch (error) {
      console.error('🔍 Header - Error inesperado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setLoginError('No pudimos iniciar sesión. Intentá de nuevo.');
      setLoggingIn(false);
    }
  }

  // Cancelar login
  function handleCancelLogin() {
    setShowPasswordModal(false);
    setSelectedParticipant(null);
    setPassword('');
  }

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  // Determinar el estilo según la página
  const isHome = pathname === '/';
  const isAdminPage = pathname?.startsWith('/admin');
  
  const headerBg = isHome 
    ? 'linear-gradient(to right, #953bff, #02efff)' 
    : 'rgba(0, 0, 0, 0.5)';
  
  // Derivar el nombre del equipo del usuario
  const derivedTeamName = userFplEntryId && isDataLoaded ? getTeamName(userFplEntryId) : '';

  return (
    <nav className="border-b border-white/10 sticky top-0 z-50 overflow-visible" style={{ background: headerBg }}>
      {/* Pattern overlay - alineado arriba y a la derecha */}
      {isHome && (
        <div 
          className="absolute right-0 top-0 h-1/2 w-1/3"
          style={{
            backgroundImage: 'url(/assets/pattern-2.png)',
            backgroundPosition: 'right top',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-14 relative">
          {/* Logo y título */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/assets/logopremierclaro.svg"
              alt="Premier League"
              width={40}
              height={50}
              className="h-7 w-auto"
            />
            {isHome ? (
              <h1 className="text-lg text-white">
                <span className="font-bold">Bet</span>
                <span className="font-normal">Federal</span>
              </h1>
            ) : (
              <h1 className="text-base text-white font-semibold uppercase tracking-wide">
                Volver
              </h1>
            )}
          </Link>

          {/* Botones de navegación */}
          {loading ? (
            <div className="w-20 h-8 bg-white/5 rounded-full animate-pulse"></div>
          ) : user ? (
            <UserProfileButton
              userName={userName}
              userTeamName={derivedTeamName}
              userTeamLogo={userTeamLogo}
              userBalance={federalBalance}
              isAdmin={isAdmin}
              isHome={isHome}
              isAdminPage={isAdminPage}
              onOpenDashboard={() => setShowDashboardModal(true)}
              onLogout={handleLogout}
            />
          ) : (
            <AuthButton
              participants={participants}
              loggingIn={loggingIn}
              onSelectUser={handleSelectUser}
            />
          )}
        </div>
      </div>

      {/* Modal de contraseña */}
      <PasswordModal
        isOpen={showPasswordModal}
        participant={selectedParticipant}
        password={password}
        loggingIn={loggingIn}
        onPasswordChange={(v) => { setPassword(v); if (loginError) setLoginError(null); }}
        onConfirm={handleLoginWithPassword}
        onCancel={handleCancelLogin}
        loginError={loginError}
      />

      {/* Modal del Dashboard */}
      <DashboardModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        user={user}
      />
    </nav>
  );
}



