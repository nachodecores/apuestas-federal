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
        
        // 2. Asegurar datos de liga para nombres/logos
        if (!isDataLoaded) {
          try { await fetchLeagueData(); } catch (e) { console.warn('⚠️ Error fetchLeagueData:', e); }
        }
        
        // 3. DESPUÉS cargar partidos desde DB
        await fetchMatchesFromDb();
        
      } catch (error) {
        console.error('💥 Error en initializeComponent:', error);
        setLoading(false);
      }
    }
    
    async function fetchMatchesFromDb() {
      try {
        // 1. Leer partidos activos desde Supabase (ordenados por GW descendente)
        const { data: dbMatches, error: mErr } = await supabase
          .from('gameweek_matches')
          .select('*')
          .eq('is_active', true)
          .order('gameweek', { ascending: false });
        if (mErr) throw mErr;
        
        if (!dbMatches || dbMatches.length === 0) {
          setError('No hay partidos activos.');
          setMatches([]);
          setLoading(false);
          return;
        }
        
        // 2. Determinar GW (la más reciente activa)
        const gw = dbMatches[0].gameweek;
        setNextGameweek(gw);
        
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
        
        // 4. Mapear a MatchDisplay con odds desde DB
        const processedMatches: MatchDisplay[] = dbMatches.map((row) => {
          const t1Name = getTeamName ? getTeamName(row.league_entry_1) : 'Equipo 1';
          const t2Name = getTeamName ? getTeamName(row.league_entry_2) : 'Equipo 2';
          const t1Manager = getPlayerName ? getPlayerName(row.league_entry_1) : 'Manager 1';
          const t2Manager = getPlayerName ? getPlayerName(row.league_entry_2) : 'Manager 2';

          return {
            gameweek: row.gameweek,
            team1Name: t1Name,
            team2Name: t2Name,
            team1Manager: t1Manager,
            team2Manager: t2Manager,
            team1Logo: (teamLogos.get(row.league_entry_1) as string) || null,
            team2Logo: (teamLogos.get(row.league_entry_2) as string) || null,
            league_entry_1: row.league_entry_1,
            league_entry_2: row.league_entry_2,
            odds: {
              home: Number(row.home_odds ?? 2.0),
              draw: Number(row.draw_odds ?? 3.0),
              away: Number(row.away_odds ?? 2.0)
            }
          };
        });
        
        setMatches(processedMatches);
        setLoading(false);
        
      } catch (err) {
        console.error('💥 Error en fetchMatchesFromDb:', err);
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



