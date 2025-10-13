"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userTeamName, setUserTeamName] = useState<string>('');
  const [userTeamLogo, setUserTeamLogo] = useState<string | null>(null);
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
        // Obtener datos completos del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, league_entry_id, team_logo')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.display_name);
          setUserTeamLogo(profile.team_logo);
          
          // Obtener nombre del equipo de la API
          const leagueResponse = await fetch('/api/league');
          const leagueData = await leagueResponse.json();
          const entry = leagueData.league_entries?.find(
            (e: any) => e.id === profile.league_entry_id
          );
          setUserTeamName(entry?.entry_name || '');
        }
      } else {
        setUserName('');
        setUserTeamName('');
        setUserTeamLogo(null);
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
              (e: any) => e.id === profile.league_entry_id
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
    } catch (error: any) {
      alert(`Error: ${error.message}\n\nEste usuario aún no está creado en el sistema.`);
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <nav className="border-b border-white/10 sticky top-0 z-50" style={{ background: 'linear-gradient(to right, #953bff, #02efff)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/assets/logopremierclaro.svg"
              alt="Premier League"
              width={40}
              height={50}
              className="h-10 w-auto"
            />
            <h1 className="text-4xl text-[#ebe5eb]">
              <span className="font-black">Bet</span>
              <span className="font-normal"> Federal</span>
            </h1>
          </Link>

          {loading ? (
            <div className="w-24 h-10 bg-white/5 rounded-full animate-pulse"></div>
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                color: 'rgb(55, 0, 60)' 
              }}
            >
              {/* Avatar - Escudo o iniciales del equipo */}
              {userTeamLogo ? (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-white/20 flex-shrink-0">
                  <Image
                    src={`/assets/${userTeamLogo}`}
                    alt={userTeamName}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {userTeamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span>{userName || 'Dashboard'}</span>
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loggingIn}
                className="px-6 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                  color: 'rgb(55, 0, 60)' 
                }}
              >
                {loggingIn ? "Ingresando..." : "¿Quién sos?"}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  
                  <div className="max-h-96 overflow-y-auto">
                    {participants.map((participant) => (
                      <button
                        key={participant.league_entry_id}
                        onClick={() => handleSelectUser(participant)}
                        disabled={loggingIn}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-3 group"
                      >
                        {/* Avatar - Escudo o iniciales del equipo */}
                        {participant.team_logo ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white/20 flex-shrink-0">
                            <Image
                              src={`/assets/${participant.team_logo}`}
                              alt={participant.teamName}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {participant.teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold">{participant.name}</div>
                          <div className="text-xs text-gray-400">{participant.teamName}</div>
                        </div>
                        <div className="text-[#00ff87] opacity-0 group-hover:opacity-100 transition-opacity">
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



