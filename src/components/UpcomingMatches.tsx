"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MatchCard from "./MatchCard";
import { useLeague } from "@/contexts/LeagueContext";
import type { User } from "@supabase/supabase-js";

// Tipos de datos que vienen de la API
interface LeagueEntry {
  id: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
}

interface ApiMatch {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
  started: boolean;
}

interface Standing {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number;
}

interface DraftLeagueData {
  league_entries: LeagueEntry[];
  matches: ApiMatch[];
  standings: Standing[];
}

// Tipo para mostrar en las cards (exportado para MatchCard)
export interface MatchDisplay {
  gameweek: number;
  team1Name: string;
  team2Name: string;
  team1Manager: string;
  team2Manager: string;
  team1Logo: string | null;
  team2Logo: string | null;
  league_entry_1: number;
  league_entry_2: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

export default function UpcomingMatches() {
  const supabase = createClient();
  
  // Usar el contexto de liga
  const { leagueData, loading: contextLoading, error: contextError, fetchLeagueData, isDataLoaded } = useLeague();
  
  // Estados de datos
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextGameweek, setNextGameweek] = useState<number>(8);
  
  // Estados de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // useEffect: Inicializar componente - primero autenticación, luego partidos
  useEffect(() => {
    async function initializeComponent() {
      console.log('🚀 Inicializando UpcomingMatches...');
      
      // Asegurar que los datos básicos de liga estén disponibles
      if (!isDataLoaded) {
        console.log('📡 Cargando datos básicos de liga...');
        await fetchLeagueData();
      }
      
      try {
        // 1. Primero verificar autenticación con timeout
        console.log('📡 Verificando autenticación...');
        
        // Crear una promesa con timeout para evitar que se cuelgue
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        let user = null;
        try {
          const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise]) as any;
          user = authUser;
          console.log('✅ Usuario verificado:', user ? 'Logueado' : 'No logueado');
        } catch (error) {
          console.warn('⚠️ Error o timeout en autenticación, continuando sin usuario:', error);
          user = null;
        }
        
      setUser(user);
      
      if (user) {
        // Obtener balance del usuario
          try {
            console.log('📡 Obteniendo balance del usuario...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance);
              console.log('✅ Balance obtenido:', profile.balance);
            } else {
              console.warn('⚠️ No se encontró perfil para el usuario');
              setUserBalance(0);
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo balance:', error);
            setUserBalance(0);
          }
        } else {
          console.log('👤 Usuario no logueado, balance = 0');
          setUserBalance(0);
        }
        
        // 2. DESPUÉS cargar partidos (independiente de autenticación)
        console.log('📡 Iniciando carga de partidos...');
        await fetchMatches();
        
        console.log('✅ UpcomingMatches inicializado completamente');
      } catch (error) {
        console.error('💥 Error en initializeComponent:', error);
        setLoading(false);
      }
    }
    
    async function fetchMatches() {
      try {
        console.log('🚀 Iniciando fetchMatches...');
        
        // 1. Una sola llamada optimizada que trae solo los datos necesarios
        console.log('📡 Obteniendo datos optimizados...');
        const response = await fetch('/api/league?upcoming=true');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos optimizados recibidos:', data);
        
        // 2. Los datos ya vienen filtrados y optimizados
        const nextGW = data.gameweek;
        const nextGWMatches = data.matches;
        
        setNextGameweek(nextGW);
        console.log('✅ Próxima gameweek:', nextGW);
        console.log('✅ Partidos de GW', nextGW, ':', nextGWMatches.length);
        
        // 3. Obtener logos de los equipos desde Supabase (con fallback)
        let teamLogos = new Map();
        try {
          console.log('📡 Obteniendo logos de equipos...');
        const { data: profiles } = await supabase
          .from('profiles')
          .select('league_entry_id, team_logo');
        
          teamLogos = new Map(
          profiles?.map(p => [p.league_entry_id, p.team_logo]) || []
        );
          console.log('✅ Logos obtenidos:', teamLogos.size);
        } catch (logoError) {
          console.warn('⚠️ Error obteniendo logos, continuando sin logos:', logoError);
          // Continuamos sin logos, no es crítico
        }
        
        // 4. Mapeamos los IDs de equipos a nombres Y usamos odds pre-calculadas
        console.log('📡 Procesando partidos...');
        const processedMatches: MatchDisplay[] = nextGWMatches.map((match, index) => {
          console.log(`📡 Procesando partido ${index + 1}/${nextGWMatches.length}...`);
          
          // Buscamos los equipos por su league_entry ID
          const team1 = data.league_entries.find(e => e.id === match.league_entry_1);
          const team2 = data.league_entries.find(e => e.id === match.league_entry_2);
          
          console.log(`📡 Equipos encontrados: ${team1?.entry_name} vs ${team2?.entry_name}`);
          
          // Buscar odds pre-calculadas para este partido
          let odds = { home: 2.0, draw: 3.0, away: 2.0 }; // Fallback por defecto
          
          if (data.gameweek_odds) {
            const matchOdds = data.gameweek_odds.find(
              (odd: any) => 
                odd.league_entry_1 === match.league_entry_1 && 
                odd.league_entry_2 === match.league_entry_2
            );
            
            if (matchOdds) {
              odds = {
                home: matchOdds.home_odds,
                draw: matchOdds.draw_odds,
                away: matchOdds.away_odds
              };
              console.log('✅ Odds pre-calculadas encontradas:', odds);
            } else {
              console.warn('⚠️ No se encontraron odds pre-calculadas, usando fallback');
            }
          } else {
            console.warn('⚠️ No hay odds pre-calculadas disponibles, usando fallback');
          }
          
          return {
            gameweek: match.event,
            team1Name: team1?.entry_name || 'Equipo 1',
            team2Name: team2?.entry_name || 'Equipo 2',
            team1Manager: team1 ? team1.player_first_name : 'Manager 1',
            team2Manager: team2 ? team2.player_first_name : 'Manager 2',
            team1Logo: (teamLogos.get(match.league_entry_1) as string) || null,
            team2Logo: (teamLogos.get(match.league_entry_2) as string) || null,
            league_entry_1: match.league_entry_1,
            league_entry_2: match.league_entry_2,
            odds
          };
        });
        
        console.log('✅ Partidos procesados:', processedMatches.length);
        console.log('📡 Estableciendo estado de partidos...');
        setMatches(processedMatches);
        console.log('📡 Estableciendo loading = false...');
        setLoading(false);
        console.log('✅ UpcomingMatches inicializado completamente');
        
      } catch (err) {
        console.error('💥 Error en fetchMatches:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    }
    
    initializeComponent();
    
    // Escuchar cambios de autenticación en TIEMPO REAL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Actualizar balance cuando el usuario se loguea
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserBalance(profile.balance);
          }
        } catch (error) {
          console.warn('⚠️ Error actualizando balance:', error);
          setUserBalance(0);
        }
      } else {
        setUserBalance(0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Función para manejar cuando se confirma una apuesta desde MatchCard
  function handleBetConfirmed(newBalance: number) {
    setUserBalance(newBalance);
  }


  // Estado de carga
  if (loading) {
    return (
      <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-3 min-[480px]:px-4 min-[768px]:px-6">
          <div className="text-[#37003c] text-base min-[480px]:text-lg min-[768px]:text-xl">Cargando próximos partidos...</div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    return (
      <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-3 min-[480px]:px-4 min-[768px]:px-6">
          <div className="text-red-500 text-base min-[480px]:text-lg min-[768px]:text-xl">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
      <div className="h-full flex flex-col px-3 min-[480px]:px-4 min-[768px]:px-6">
        <h3 className="text-lg mobile:text-xl tablet:text-2xl font-black text-[#37003c] mb-6">
          Próximos Partidos
        </h3>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 mobile:gap-5 tablet:gap-6">
            {matches.map((match, idx) => (
              <MatchCard
                key={idx}
                match={match}
                matchIndex={idx}
                user={user}
                userBalance={userBalance}
                onBetConfirmed={handleBetConfirmed}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}



