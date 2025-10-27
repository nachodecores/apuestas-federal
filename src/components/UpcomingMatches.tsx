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
  const { leagueData, loading: contextLoading, error: contextError, fetchLeagueData, isDataLoaded, getTeamName, getPlayerName } = useLeague();
  
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
  
  // useEffect: Procesar partidos cuando el contexto esté cargado
  useEffect(() => {
    async function processMatches() {
      if (!isDataLoaded || !leagueData) {
        setLoading(true);
        return;
      }

      try {
        // 1. Obtener partidos activos del contexto
        const upcomingMatches = leagueData.matches.filter(m => !m.finished);
        if (!upcomingMatches.length) {
          setError('No hay partidos próximos');
          setLoading(false);
          return;
        }
        
        const currentGW = upcomingMatches[0].event;
        setNextGameweek(currentGW);

        // 2. Obtener odds desde gameweek_matches
        const { data: oddsData } = await supabase
          .from('gameweek_matches')
          .select('*')
          .eq('is_active', true)
          .eq('gameweek', currentGW);

        // 3. Mapear partidos con odds
        const processedMatches = upcomingMatches.map(match => {
          const matchOdds = oddsData?.find(o => 
            o.league_entry_1 === match.league_entry_1 && 
            o.league_entry_2 === match.league_entry_2
          );

          return {
            gameweek: match.event,
            team1Name: getTeamName(match.league_entry_1),
            team2Name: getTeamName(match.league_entry_2),
            team1Manager: getPlayerName(match.league_entry_1),
            team2Manager: getPlayerName(match.league_entry_2),
            team1Logo: null, // TODO: Implementar logos de equipos
            team2Logo: null, // TODO: Implementar logos de equipos
            league_entry_1: match.league_entry_1,
            league_entry_2: match.league_entry_2,
            odds: {
              home: matchOdds?.home_odds ?? 2.0,
              draw: matchOdds?.draw_odds ?? 3.0,
              away: matchOdds?.away_odds ?? 2.0
            }
          };
        });

        setMatches(processedMatches);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
        setLoading(false);
      }
    }

    processMatches();
  }, [isDataLoaded, leagueData, getTeamName, getPlayerName, supabase]);

  // useEffect: Inicializar autenticación
  useEffect(() => {
    async function initializeAuth() {
      try {
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
              .select('federal_balance')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              setUserBalance(profile.federal_balance);
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
      } catch (error) {
        console.error('💥 Error en initializeAuth:', error);
      }
    }
    
    initializeAuth();
    
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
            .select('federal_balance')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserBalance(profile.federal_balance);
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
          <div className="text-white text-base min-[480px]:text-lg min-[768px]:text-xl">Cargando próximos partidos...</div>
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