"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

// Tipo para participantes con sus datos
interface Participant {
  name: string;
  teamName: string;
  league_entry_id: number;
  team_logo: string | null;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userTeamName, setUserTeamName] = useState<string>('');
  const [userTeamLogo, setUserTeamLogo] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Obtener usuario actual, nombre y participantes
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Obtener datos completos del perfil (incluyendo balance)
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, league_entry_id, team_logo, balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.display_name);
          setUserTeamLogo(profile.team_logo);
          setUserBalance(profile.balance || 0);
          
          // Verificar si es admin (Ignacio de Cores)
          setIsAdmin(profile.display_name === 'Ignacio de Cores');
          
          // Obtener nombre del equipo de la API
          const leagueResponse = await fetch('/api/league');
          const leagueData = await leagueResponse.json();
          const entry = leagueData.league_entries?.find(
            (e: { id: number; entry_name: string }) => e.id === profile.league_entry_id
          );
          setUserTeamName(entry?.entry_name || '');
        }
      } else {
        setUserName('');
        setUserTeamName('');
        setUserTeamLogo(null);
        setUserBalance(0);
        setIsAdmin(false);
      }
      
      // Obtener todos los participantes con sus logos y nombres de equipo
      try {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('display_name, league_entry_id, team_logo, fpl_entry_id')
          .order('display_name');
        
        if (allProfiles) {
          // Obtener nombres de equipos de la API de FPL
          const leagueResponse = await fetch('/api/league');
          const leagueData = await leagueResponse.json();
          
          const participantsData: Participant[] = allProfiles.map(profile => {
            const entry = leagueData.league_entries?.find(
              (e: { id: number; entry_name: string }) => e.id === profile.league_entry_id
            );
            
            return {
              name: profile.display_name,
              teamName: entry?.entry_name || 'Sin equipo',
              league_entry_id: profile.league_entry_id,
              team_logo: profile.team_logo
            };
          });
          
          setParticipants(participantsData);
        }
      } catch (error) {
        console.error('Error cargando participantes:', error);
        // Usar datos por defecto si falla
        setParticipants([
          { name: 'Chacho Bonino', teamName: 'Quebracho', league_entry_id: 6753, team_logo: null },
          { name: 'Marcos Arocena', teamName: 'Tranqueras', league_entry_id: 5156, team_logo: null },
          { name: 'Ignacio de Cores', teamName: 'CA Tambores RF', league_entry_id: 38904, team_logo: null },
          { name: 'Manuel Domenech', teamName: 'Sportivo Nico Perez', league_entry_id: 44346, team_logo: null },
          { name: 'Juan Dehl', teamName: 'CA Tres Islas', league_entry_id: 54556, team_logo: null },
          { name: 'Juan Francisco Sienra', teamName: 'Palmitas City', league_entry_id: 5769, team_logo: null },
          { name: 'Felipe Migues', teamName: 'Migues', league_entry_id: 5997, team_logo: null },
          { name: 'Joaquin Sarachaga', teamName: 'Deportivo Sauce', league_entry_id: 6494, team_logo: null },
          { name: 'Javier Villaamil', teamName: 'Mal Abrigo Town', league_entry_id: 6479, team_logo: null },
          { name: 'Ángel Cal', teamName: 'Pirarajá United', league_entry_id: 5865, team_logo: null },
        ]);
      }
      
      setLoading(false);
    }
    
    getUserData();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUserName('');
        setUserTeamName('');
        setUserTeamLogo(null);
        setUserBalance(0);
        setIsAdmin(false);
      } else {
        // Actualizar todos los datos del usuario cuando se loguea o cambia sesión
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance, display_name, league_entry_id, team_logo')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance || 0);
          setUserName(profile.display_name);
          setUserTeamLogo(profile.team_logo);
          setIsAdmin(profile.display_name === 'Ignacio de Cores');
          
          // Obtener nombre del equipo de la API
          const leagueResponse = await fetch('/api/league');
          const leagueData = await leagueResponse.json();
          const entry = leagueData.league_entries?.find(
            (e: { id: number; entry_name: string }) => e.id === profile.league_entry_id
          );
          setUserTeamName(entry?.entry_name || '');
        }
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Login automático al seleccionar usuario
  async function handleSelectUser(participant: Participant) {
    setLoggingIn(true);
    
    try {
      const email = `${participant.league_entry_id}@bolichefederal.com`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: '1234',
      });

      if (error) throw error;

      // Cerrar el dropdown
      setShowDropdown(false);
      // NO redirigimos al dashboard, el usuario se queda en la página actual
      // El Header se actualiza automáticamente mostrando el botón "Dashboard"
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}\n\nEste usuario aún no está creado en el sistema.`);
    } finally {
      setLoggingIn(false);
    }
  }

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  // Determinar el estilo según la página
  const isHome = pathname === '/';
  const isAdminPage = pathname?.startsWith('/admin');
  const isDashboard = pathname?.startsWith('/dashboard');
  
  const headerBg = isHome 
    ? 'linear-gradient(to right, #953bff, #02efff)' 
    : 'rgba(0, 0, 0, 0.5)';

  return (
    <nav className="border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm overflow-visible" style={{ background: headerBg }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 relative">
          {/* Logo y título */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/assets/logopremierclaro.svg"
              alt="Premier League"
              width={40}
              height={50}
              className="h-7 sm:h-9 md:h-10 w-auto"
            />
            {isHome ? (
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white">
                <span className="font-black">Bet</span>
                <span className="font-normal">Federal</span>
              </h1>
            ) : (
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl text-white font-semibold uppercase tracking-wide">
                Volver
              </h1>
            )}
          </Link>

          {/* Botones de navegación */}
          {loading ? (
            <div className="w-20 h-8 sm:w-24 sm:h-10 bg-white/5 rounded-full animate-pulse"></div>
          ) : user ? (
            // Usuario logueado - mostrar opciones
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Avatar + Nombre + Balance (solo en home) */}
              {isHome && (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Balance disponible */}
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[0.625rem] text-white/70 uppercase tracking-wider">Disponible</span>
                    <span className="text-sm sm:text-base font-bold text-[#00ff87]">
                      ${userBalance.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Link al dashboard con avatar */}
                  <Link
                    href="/dashboard"
                    className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 sm:gap-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                      color: 'rgb(55, 0, 60)' 
                    }}
                  >
                    {/* Texto a la izquierda, alineado a la derecha */}
                    <div className="flex flex-col items-end text-right">
                      <span className="font-semibold text-[0.625rem] sm:text-xs leading-tight">{userName}</span>
                      <span className="text-[0.625rem] sm:text-xs text-gray-600 leading-tight font-light">{userTeamName}</span>
                    </div>
                    
                    {/* Avatar a la derecha */}
                    {userTeamLogo ? (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white border border-white/20 flex-shrink-0">
                        <Image
                          src={`/assets/${userTeamLogo}`}
                          alt={userTeamName}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-[0.625rem] sm:text-xs flex-shrink-0">
                        {userTeamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </div>
              )}

              {/* Botón Dashboard (en admin) */}
              {isAdminPage && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs sm:text-sm font-semibold"
                >
                  Dashboard
                </Link>
              )}

              {/* Botón Admin (en dashboard) - SOLO si es Ignacio de Cores */}
              {isDashboard && isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-xl bg-[#ff2882]/10 border border-[#ff2882]/50 text-[#ff2882] hover:bg-[#ff2882]/20 transition-colors text-xs sm:text-sm font-semibold"
                >
                  Admin
                </Link>
              )}

              {/* Botón Cerrar sesión (en dashboard y admin) */}
              {(isDashboard || isAdminPage) && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs sm:text-sm font-semibold"
                >
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              )}
            </div>
          ) : (
            // Usuario NO logueado - mostrar dropdown
            <div className="relative z-[100]" ref={dropdownRef}>
              <button
                onClick={() => {
                  console.log('Dropdown clicked, current state:', showDropdown);
                  setShowDropdown(!showDropdown);
                }}
                disabled={loggingIn}
                className="px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 text-sm sm:text-base rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                  color: 'rgb(55, 0, 60)' 
                }}
              >
                {loggingIn ? "Ingresando..." : "¿Quién sos?"}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 md:w-80 max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[9999]"
                  style={{ display: 'block' }}
                  ref={(el) => el && console.log('Dropdown rendered:', el)}
                >
                  
                  <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
                    {participants.map((participant) => (
                      <button
                        key={participant.league_entry_id}
                        onClick={() => handleSelectUser(participant)}
                        disabled={loggingIn}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 sm:gap-3 group"
                      >
                        {/* Avatar - Escudo o iniciales del equipo */}
                        {participant.team_logo ? (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-white border border-white/20 flex-shrink-0">
                            <Image
                              src={`/assets/${participant.team_logo}`}
                              alt={participant.teamName}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                            {participant.teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate">{participant.teamName}</div>
                          <div className="text-xs text-gray-500 truncate">{participant.name}</div>
                        </div>
                        <div className="text-[#00ff87] opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                          →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}



