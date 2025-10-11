"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

interface DraftLeagueData {
  league_entries: LeagueEntry[];
  matches: ApiMatch[];
}

// Tipo para mostrar en las cards
interface MatchDisplay {
  gameweek: number;
  team1Name: string;
  team2Name: string;
  team1Manager: string;
  team2Manager: string;
  league_entry_1: number;
  league_entry_2: number;
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
        
        // 2. Encontramos el próximo gameweek (el primero que no haya terminado)
        const upcomingMatches = data.matches.filter(match => !match.finished);
        
        if (upcomingMatches.length === 0) {
          throw new Error('No hay partidos próximos');
        }
        
        // El gameweek del primer partido no terminado
        const nextGW = upcomingMatches[0].event;
        setNextGameweek(nextGW);
        
        // 3. Filtramos solo los partidos de ese gameweek
        const nextGWMatches = upcomingMatches.filter(match => match.event === nextGW);
        
        // 4. Mapeamos los IDs de equipos a nombres
        const processedMatches: MatchDisplay[] = nextGWMatches.map(match => {
          // Buscamos los equipos por su league_entry ID
          const team1 = data.league_entries.find(e => e.id === match.league_entry_1);
          const team2 = data.league_entries.find(e => e.id === match.league_entry_2);
          
          return {
            gameweek: match.event,
            team1Name: team1?.entry_name || 'Equipo 1',
            team2Name: team2?.entry_name || 'Equipo 2',
            team1Manager: team1 ? `${team1.player_first_name} ${team1.player_last_name}` : 'Manager 1',
            team2Manager: team2 ? `${team2.player_first_name} ${team2.player_last_name}` : 'Manager 2',
            league_entry_1: match.league_entry_1,
            league_entry_2: match.league_entry_2
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

  // Función para crear la apuesta
  async function handlePlaceBet(matchIndex: number, match: MatchDisplay) {
    const bet = bets[matchIndex];
    
    // Validaciones
    if (!user) {
      alert('Necesitás iniciar sesión para apostar');
      return;
    }
    
    if (!bet?.prediction) {
      alert('Seleccioná un resultado (Local, Empate o Visitante)');
      return;
    }
    
    if (!bet.amount || parseFloat(bet.amount) <= 0) {
      alert('Ingresá un monto válido para apostar');
      return;
    }
    
    const amount = parseFloat(bet.amount);
    
    if (amount > userBalance) {
      alert(`No tenés suficiente saldo. Tu balance es $${userBalance}`);
      return;
    }
    
    // TODO: Aquí vamos a crear la apuesta en la base de datos
    console.log('Apuesta:', {
      user_id: user.id,
      gameweek: match.gameweek,
      match_league_entry_1: match.league_entry_1,
      match_league_entry_2: match.league_entry_2,
      prediction: bet.prediction,
      amount
    });
    
    alert(`¡Apuesta creada! $${amount} a ${bet.prediction === 'home' ? match.team1Manager : bet.prediction === 'away' ? match.team2Manager : 'Empate'}`);
  }

  // Estado de carga
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-transparent to-[#37003c]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white text-xl">Cargando próximos partidos...</div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-transparent to-[#37003c]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-[#37003c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl sm:text-4xl font-black text-white mb-12">
          Próximos Partidos - GW{nextGameweek}
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff2882]/50 transition-all hover:scale-105"
            >
              <div className="text-xs text-[#ff2882] font-semibold uppercase tracking-wider mb-4">
                Gameweek {match.gameweek}
              </div>
              
              {/* Equipos */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                    {match.team1Manager.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{match.team1Manager}</div>
                  <div className="text-gray-500 text-xs">{match.team1Name}</div>
                </div>
                
                <div className="text-gray-600 font-black text-xl px-4">VS</div>
                
                <div className="text-center flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#37003c] to-[#00ff87] mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                    {match.team2Manager.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{match.team2Manager}</div>
                  <div className="text-gray-500 text-xs">{match.team2Name}</div>
                </div>
              </div>

              {/* Radio buttons para predicción */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  ¿Quién gana?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Local */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'home')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      bets[idx]?.prediction === 'home'
                        ? 'bg-[#ff2882] text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Local
                  </button>
                  
                  {/* Empate */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'draw')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      bets[idx]?.prediction === 'draw'
                        ? 'bg-[#00ff87] text-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Empate
                  </button>
                  
                  {/* Visitante */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(idx, 'away')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      bets[idx]?.prediction === 'away'
                        ? 'bg-[#37003c] text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Visitante
                  </button>
                </div>
              </div>

              {/* Input de monto */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Monto a apostar
                  {user && <span className="text-[#00ff87] ml-2">(Disponible: ${userBalance})</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="text"
                    value={bets[idx]?.amount || ''}
                    onChange={(e) => handleAmountChange(idx, e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                  />
                </div>
              </div>

              {/* Botón para confirmar apuesta */}
              <button 
                onClick={() => handlePlaceBet(idx, match)}
                disabled={!user || !bets[idx]?.prediction || !bets[idx]?.amount}
                className="w-full py-3 rounded-xl bg-[#ff2882] text-white font-bold hover:bg-[#ff2882]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!user ? 'Ingresá para apostar' : 'Confirmar apuesta'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



