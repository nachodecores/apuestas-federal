"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MatchCard from "./MatchCard";
import { useLeague } from "@/contexts/LeagueContext";
import type { User } from "@supabase/supabase-js";
import { MatchDisplay, LeagueEntry, ApiMatch, Standing, DraftLeagueData } from "@/types";

export default function UpcomingMatches() {
  const supabase = createClient();
  
  // Usar el contexto de liga
  const { leagueData, loading: contextLoading, error: contextError, fetchLeagueData, isDataLoaded } = useLeague();
  
  console.log('🔍 UpcomingMatches: Renderizando componente');
  console.log('🔍 UpcomingMatches: leagueData:', !!leagueData);
  console.log('🔍 UpcomingMatches: contextLoading:', contextLoading);
  console.log('🔍 UpcomingMatches: contextError:', contextError);
  console.log('🔍 UpcomingMatches: isDataLoaded:', isDataLoaded);
  
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
      
      // Los datos de liga se cargarán automáticamente por el contexto
      
      try {
        // 1. Primero verificar autenticación con timeout
        
        // Crear una promesa con timeout para evitar que se cuelgue
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        let user = null;
        try {
          const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise]) as any;
          user = authUser;
        } catch (error) {
          console.warn('⚠️ Error o timeout en autenticación, continuando sin usuario:', error);
          user = null;
        }
        
      setUser(user);
      
      if (user) {
        // Obtener balance del usuario
          try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance);
            } else {
              console.warn('⚠️ No se encontró perfil para el usuario');
              setUserBalance(0);
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo balance:', error);
            setUserBalance(0);
        }
      } else {
        setUserBalance(0);
      }
        
        // 2. DESPUÉS cargar partidos (independiente de autenticación)
        await fetchMatches();
        
      } catch (error) {
        console.error('💥 Error en initializeComponent:', error);
        setLoading(false);
      }
    }
    
    async function fetchMatches() {
      try {
        
        // 1. Una sola llamada optimizada que trae solo los datos necesarios
        const response = await fetch('/api/league?upcoming=true');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 2. Los datos ya vienen filtrados y optimizados
        const nextGW = data.gameweek;
        const nextGWMatches = data.matches;
        
        setNextGameweek(nextGW);
        
        // 3. Obtener logos de los equipos desde Supabase (con fallback)
        let teamLogos = new Map();
        try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('fpl_entry_id, team_logo');
        
          teamLogos = new Map(
          profiles?.map(p => [p.fpl_entry_id, p.team_logo]) || []
        );
        } catch (logoError) {
          console.warn('⚠️ Error obteniendo logos, continuando sin logos:', logoError);
          // Continuamos sin logos, no es crítico
        }
        
        // 4. Mapeamos los IDs de equipos a nombres Y usamos odds pre-calculadas
        const processedMatches: MatchDisplay[] = nextGWMatches.map((match, index) => {
          
          // Buscamos los equipos por su league_entry ID
          const team1 = data.league_entries.find(e => e.id === match.league_entry_1);
          const team2 = data.league_entries.find(e => e.id === match.league_entry_2);
          
          
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
        
        setMatches(processedMatches);
        setLoading(false);
        
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
    console.log('🔍 UpcomingMatches: Renderizando estado de carga');
    return (
      <section className="bg-[#37003c] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-3 min-[480px]:px-4 min-[768px]:px-6">
          <div className="text-[#37003c] text-base min-[480px]:text-lg min-[768px]:text-xl">Cargando próximos partidos...</div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    console.log('🔍 UpcomingMatches: Renderizando estado de error:', error);
    return (
      <section className="bg-[#37003c] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-3 min-[480px]:px-4 min-[768px]:px-6">
          <div className="text-red-500 text-base min-[480px]:text-lg min-[768px]:text-xl">Error: {error}</div>
        </div>
      </section>
    );
  }

  console.log('🔍 UpcomingMatches: Renderizando partidos con datos:', matches.length, 'partidos');
  return (
    <section className="bg-[#37003c] h-full pb-4 mobile:pb-6 tablet:pb-8">
      <div className="h-full flex flex-col px-3 min-[480px]:px-4 min-[768px]:px-6">
        <h3 className="text-lg mobile:text-xl tablet:text-2xl font-black text-white mb-6">
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



