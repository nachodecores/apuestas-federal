"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MatchCard from "./MatchCard";
import { useLeague } from "@/contexts/LeagueContext";
import { useUser } from "@/contexts/UserContext";
import type { User } from "@supabase/supabase-js";
import { MatchDisplay, LeagueEntry, ApiMatch, Standing, DraftLeagueData } from "@/types";

export default function UpcomingMatches() {
  const supabase = createClient();
  
  // Usar el contexto de liga
  const { leagueData, loading: contextLoading, error: contextError, fetchLeagueData, isDataLoaded, getTeamName, getPlayerName } = useLeague();
  
  // Usar contexto global de usuario
  const { user, federalBalance, refreshProfile } = useUser();
  
  // Estados de datos
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextGameweek, setNextGameweek] = useState<number>(8);
  
  // Estados de apuestas optimizadas
  const [userBets, setUserBets] = useState<any[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  
  // useEffect: Procesar partidos cuando el contexto esté cargado
  useEffect(() => {
    async function processMatches() {
      if (!isDataLoaded || !leagueData) {
        setLoading(true);
        return;
      }

      try {
        // 1. Obtener gameweek activa desde gameweek_matches
        const { data: activeGwData } = await supabase
          .from('gameweek_matches')
          .select('gameweek')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        const activeGameweek = activeGwData?.gameweek ?? null;
        if (!activeGameweek) {
          setError('No hay gameweek activa');
          setLoading(false);
          return;
        }

        setNextGameweek(activeGameweek);

        // 2. Obtener partidos de la gameweek activa (no finalizados)
        const upcomingMatches = leagueData.matches.filter(
          m => !m.finished && m.event === activeGameweek
        );
        if (!upcomingMatches.length) {
          setError('No hay partidos próximos');
          setLoading(false);
          return;
        }
        
        // 3. Obtener odds desde gameweek_matches
        const { data: oddsData } = await supabase
          .from('gameweek_matches')
          .select('*')
          .eq('is_active', true)
          .eq('gameweek', activeGameweek);

        // 4. Mapear partidos con odds
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

  // Ya no necesitamos manejar autenticación aquí, el contexto lo hace

  // useEffect: Cargar apuestas cuando cambie el usuario o el gameweek
  useEffect(() => {
    if (user && nextGameweek) {
      loadUserBets(nextGameweek);
    } else {
      setUserBets([]);
    }
  }, [user, nextGameweek]);

  // Escuchar eliminaciones para refrescar apuestas en esta vista
  useEffect(() => {
    function handleBetDeleted() {
      (async () => {
        await refreshProfile();
        if (nextGameweek) {
          loadUserBets(nextGameweek);
        }
      })();
    }
    window.addEventListener('betDeleted', handleBetDeleted as EventListener);
    return () => window.removeEventListener('betDeleted', handleBetDeleted as EventListener);
  }, [nextGameweek, user, refreshProfile]);

  // Función para cargar todas las apuestas del usuario para el gameweek actual
  async function loadUserBets(gameweek: number) {
    if (!user) {
      setUserBets([]);
      return;
    }

    setBetsLoading(true);
    try {
      const response = await fetch(`/api/bets/user-bets?gameweek=${gameweek}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserBets(data.bets || []);
      } else {
        console.error('Error loading user bets:', data.error);
        setUserBets([]);
      }
    } catch (error) {
      console.error('Error loading user bets:', error);
      setUserBets([]);
    } finally {
      setBetsLoading(false);
    }
  }

  // Función para manejar cuando se confirma una apuesta desde MatchCard
  async function handleBetConfirmed(newBalance: number) {
    // Refrescar el perfil desde el contexto para sincronizar balance
    await refreshProfile();
    // Recargar apuestas después de confirmar una nueva
    if (nextGameweek) {
      loadUserBets(nextGameweek);
    }
  }


  // Estado de carga
  if (loading) {
    return (
      <section className="bg-[#37003c] h-full pt-4 mobile:pt-6 tablet:pt-8 pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-2 mobile:px-3 tablet:px-4">
          <div className="text-white text-sm mobile:text-base tablet:text-lg">Cargando próximos partidos...</div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    return (
      <section className="bg-[#37003c] h-full pt-4 mobile:pt-6 tablet:pt-8 pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-2 mobile:px-3 tablet:px-4">
          <div className="text-red-500 text-sm mobile:text-base tablet:text-lg">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="upcoming-matches" className="bg-[#37003c] h-full pt-4 mobile:pt-6 tablet:pt-8 pb-4 mobile:pb-6 tablet:pb-8">
      <div className="h-full flex flex-col px-3 min-[480px]:px-4 min-[768px]:px-6">
        <h3 className="text-lg mobile:text-xl tablet:text-2xl font-bold text-white mb-6 ml-2 mobile:ml-3 tablet:ml-4">
          Upcoming Matches
        </h3>

        <div className="flex-1 overflow-y-auto w-full grid grid-cols-1 gap-0">
          {matches.map((match, idx) => {
              // Buscar la apuesta del usuario para este partido específico
              const userBet = userBets.find(bet => 
                bet.match_league_entry_1 === match.league_entry_1 && 
                bet.match_league_entry_2 === match.league_entry_2
              );
              
              return (
                <MatchCard
                  key={idx}
                  match={match}
                  matchIndex={idx}
                  user={user}
                  userBalance={federalBalance}
                  onBetConfirmed={handleBetConfirmed}
                  userBet={userBet}
                />
              );
            })}
        </div>

      </div>
    </section>
  );
}