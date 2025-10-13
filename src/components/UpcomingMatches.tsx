"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { calculateOdds } from "@/lib/odds-calculator";

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

// Tipo para mostrar en las cards
interface MatchDisplay {
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

// Tipo para la apuesta de cada partido
interface BetSelection {
  prediction: 'home' | 'draw' | 'away' | null;
  amount: string;
}

export default function UpcomingMatches() {
  const supabase = createClient();
  
  // Estados de datos
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [allMatches, setAllMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextGameweek, setNextGameweek] = useState<number>(8);
  
  // Estados de autenticación
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // Estado para las apuestas de cada partido
  // Usamos un objeto con key = índice del partido
  const [bets, setBets] = useState<Record<number, BetSelection>>({});

  // useEffect 1: Obtener usuario y su balance
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Obtener balance del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance);
        }
      }
    }
    
    getUser();
    
    // Escuchar cambios de autenticación en TIEMPO REAL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Actualizar balance cuando el usuario se loguea
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance);
        }
      } else {
        setUserBalance(0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  // useEffect 2: Obtener partidos de la API
  useEffect(() => {
    async function fetchMatches() {
      try {
        // 1. Traemos los datos de nuestra API
        const response = await fetch('/api/league');
        
        if (!response.ok) {
          throw new Error('Error al obtener datos de la liga');
        }
        
        const data: DraftLeagueData = await response.json();
        
        // Guardar standings y matches para calcular odds
        setStandings(data.standings);
        setAllMatches(data.matches);
        
        // 2. Obtener logos de los equipos desde Supabase
        const { data: profiles } = await supabase
          .from('profiles')
          .select('league_entry_id, team_logo');
        
        const teamLogos = new Map(
          profiles?.map(p => [p.league_entry_id, p.team_logo]) || []
        );
        
        // 3. Encontramos el próximo gameweek (el primero que no haya terminado)
        const upcomingMatches = data.matches.filter(match => !match.finished);
        
        if (upcomingMatches.length === 0) {
          throw new Error('No hay partidos próximos');
        }
        
        // El gameweek del primer partido no terminado
        const nextGW = upcomingMatches[0].event;
        setNextGameweek(nextGW);
        
        // 3. Filtramos solo los partidos de ese gameweek
        const nextGWMatches = upcomingMatches.filter(match => match.event === nextGW);
        
        // 4. Mapeamos los IDs de equipos a nombres Y calculamos odds
        const processedMatches: MatchDisplay[] = nextGWMatches.map(match => {
          // Buscamos los equipos por su league_entry ID
          const team1 = data.league_entries.find(e => e.id === match.league_entry_1);
          const team2 = data.league_entries.find(e => e.id === match.league_entry_2);
          
          // Calcular odds dinámicos para este partido
          const odds = calculateOdds(
            match.league_entry_1,
            match.league_entry_2,
            data.standings,
            data.matches
          );
          
          return {
            gameweek: match.event,
            team1Name: team1?.entry_name || 'Equipo 1',
            team2Name: team2?.entry_name || 'Equipo 2',
            team1Manager: team1 ? `${team1.player_first_name} ${team1.player_last_name}` : 'Manager 1',
            team2Manager: team2 ? `${team2.player_first_name} ${team2.player_last_name}` : 'Manager 2',
            team1Logo: teamLogos.get(match.league_entry_1) || null,
            team2Logo: teamLogos.get(match.league_entry_2) || null,
            league_entry_1: match.league_entry_1,
            league_entry_2: match.league_entry_2,
            odds
          };
        });
        
        setMatches(processedMatches);
        setLoading(false);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    }
    
    fetchMatches();
  }, []);

  // Función para actualizar la predicción de un partido
  function handlePredictionChange(matchIndex: number, prediction: 'home' | 'draw' | 'away') {
    setBets(prev => ({
      ...prev,
      [matchIndex]: {
        ...prev[matchIndex],
        prediction,
        amount: prev[matchIndex]?.amount || ''
      }
    }));
  }

  // Función para actualizar el monto de la apuesta
  function handleAmountChange(matchIndex: number, amount: string) {
    // Solo permitir números y punto decimal
    if (amount && !/^\d*\.?\d*$/.test(amount)) return;
    
    setBets(prev => ({
      ...prev,
      [matchIndex]: {
        ...prev[matchIndex],
        prediction: prev[matchIndex]?.prediction || null,
        amount
      }
    }));
  }

  // Calcular balance disponible (descontando lo ya apostado)
  function getAvailableBalance() {
    const totalBet = Object.values(bets)
      .filter(b => b?.amount)
      .reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0);
    
    return userBalance - totalBet;
  }

  // Función para confirmar TODAS las apuestas del gameweek
  async function handleConfirmAllBets() {
    // Validaciones
    if (!user) {
      alert('Necesitás iniciar sesión para apostar');
      return;
    }
    
    // Filtrar solo las apuestas que tienen predicción y monto
    const validBets = matches
      .map((match, idx) => ({ match, bet: bets[idx], index: idx }))
      .filter(({ bet }) => bet?.prediction && bet.amount && parseFloat(bet.amount) > 0);
    
    if (validBets.length === 0) {
      alert('No hay apuestas para confirmar. Seleccioná al menos un resultado y monto.');
      return;
    }
    
    // Calcular total a apostar
    const totalAmount = validBets.reduce((sum, { bet }) => sum + parseFloat(bet.amount), 0);
    
    if (totalAmount > userBalance) {
      alert(`No tenés suficiente saldo. Total: $${totalAmount}, Disponible: $${userBalance}`);
      return;
    }
    
    // Preparar datos para enviar al backend
    const betsData = validBets.map(({ match, bet }) => {
      const betAmount = parseFloat(bet.amount);
      const selectedOdd = match.odds[bet.prediction!];
      
      return {
        gameweek: match.gameweek,
        match_league_entry_1: match.league_entry_1,
        match_league_entry_2: match.league_entry_2,
        prediction: bet.prediction!,
        amount: betAmount,
        odds: selectedOdd,
        potential_win: betAmount * selectedOdd
      };
    });
    
    try {
      // Llamar al endpoint para crear las apuestas
      const response = await fetch('/api/bets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bets: betsData }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear apuestas');
      }
      
      // Éxito! Actualizar el balance local
      setUserBalance(result.new_balance);
      
      // Mostrar mensaje de éxito
      alert(`🎉 ¡${result.bets_created} apuesta(s) confirmadas!\n\nTotal apostado: $${totalAmount.toFixed(2)}\nNuevo balance: $${result.new_balance.toFixed(2)}`);
      
      // Limpiar el formulario
      setBets({});
      
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      console.error('Error al confirmar apuestas:', error);
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#37003c]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
          <div className="text-white text-base sm:text-lg md:text-xl">Cargando próximos partidos...</div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#37003c]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
          <div className="text-red-500 text-base sm:text-lg md:text-xl">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#37003c]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-6 sm:mb-8 md:mb-12">
          Próximos Partidos - GW{nextGameweek}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-[#ff2882]/50 transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
            >
            
              
              {/* Equipos */}
              <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
                <div className="text-center flex-1">
                  {/* Avatar - Escudo o iniciales del equipo */}
                  {match.team1Logo ? (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto mb-1.5 sm:mb-2 overflow-hidden bg-white border border-white/20 sm:border-2">
                      <Image
                        src={`/assets/${match.team1Logo}`}
                        alt={match.team1Name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-1.5 sm:mb-2 flex items-center justify-center text-white font-bold text-[0.625rem] sm:text-xs">
                      {match.team1Name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="text-gray-900 font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 truncate px-1">{match.team1Name}</div>
                  <div className="text-gray-600 text-[0.625rem] sm:text-xs truncate px-1">{match.team1Manager}</div>
                </div>
                
                <div className="text-gray-800 font-black text-base sm:text-lg md:text-xl px-2 sm:px-3 md:px-4">VS</div>
                
                <div className="text-center flex-1">
                  {/* Avatar - Escudo o iniciales del equipo */}
                  {match.team2Logo ? (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto mb-1.5 sm:mb-2 overflow-hidden bg-white border border-white/20 sm:border-2">
                      <Image
                        src={`/assets/${match.team2Logo}`}
                        alt={match.team2Name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#37003c] to-[#00ff87] mx-auto mb-1.5 sm:mb-2 flex items-center justify-center text-white font-bold text-[0.625rem] sm:text-xs">
                      {match.team2Name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="text-gray-900 font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 truncate px-1">{match.team2Name}</div>
                  <div className="text-gray-600 text-[0.625rem] sm:text-xs truncate px-1">{match.team2Manager}</div>
                </div>
              </div>

              {/* Radio buttons para predicción */}
              <div className="mb-3 sm:mb-4">
          
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Local */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'home')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bets[idx]?.prediction === 'home'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bets[idx]?.prediction === 'home' 
                      ? { background: 'linear-gradient(to right, rgb(2, 239, 255), rgb(0, 255, 135))' }
                      : { backgroundColor: 'rgb(239, 239, 239)' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bets[idx]?.prediction === 'home' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Local
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bets[idx]?.prediction === 'home' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.home.toFixed(2)}x
                    </div>
                  </button>
                  
                  {/* Empate */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'draw')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bets[idx]?.prediction === 'draw'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bets[idx]?.prediction === 'draw' 
                      ? { background: 'linear-gradient(to right, rgb(2, 239, 255), rgb(0, 255, 135))' }
                      : { backgroundColor: 'rgb(239, 239, 239)' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bets[idx]?.prediction === 'draw' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Empate
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bets[idx]?.prediction === 'draw' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.draw.toFixed(2)}x
                    </div>
                  </button>
                  
                  {/* Visitante */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'away')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bets[idx]?.prediction === 'away'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bets[idx]?.prediction === 'away' 
                      ? { background: 'linear-gradient(to right, rgb(2, 239, 255), rgb(0, 255, 135))' }
                      : { backgroundColor: 'rgb(239, 239, 239)' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bets[idx]?.prediction === 'away' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Visitante
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bets[idx]?.prediction === 'away' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.away.toFixed(2)}x
                    </div>
                  </button>
                </div>
              </div>

              {/* Input de monto */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-[0.625rem] sm:text-xs text-gray-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Monto a apostar
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm sm:text-base">$</span>
                  <input
                    type="text"
                    value={bets[idx]?.amount || ''}
                    onChange={(e) => handleAmountChange(idx, e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ff2882] transition-colors text-sm sm:text-base"
                  />
                </div>
                
                {/* Mostrar ganancia potencial */}
                {bets[idx]?.prediction && bets[idx]?.amount && parseFloat(bets[idx].amount) > 0 && (
                  <div className="mt-1.5 sm:mt-2 text-[0.625rem] sm:text-xs text-gray-600">
                    Ganancia potencial: 
                    <span className="text-[#00a85a] font-bold ml-1">
                      ${(parseFloat(bets[idx].amount) * match.odds[bets[idx].prediction!]).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Botón para confirmar TODAS las apuestas */}
        {user && (
          <div className="mt-6 sm:mt-8 md:mt-12 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3 sm:gap-0">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                    Resumen de apuestas
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {Object.values(bets).filter(b => b?.prediction && b?.amount).length} apuesta(s) seleccionada(s)
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-400">Total a apostar</div>
                  <div className="text-xl sm:text-2xl font-black text-[#ff2882]">
                    ${Object.values(bets)
                      .filter(b => b?.amount)
                      .reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleConfirmAllBets}
                disabled={Object.values(bets).filter(b => b?.prediction && b?.amount).length === 0}
                className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl gradient-fpl font-bold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#00ff87]/20"
              >
                Confirmar Apuestas
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}



