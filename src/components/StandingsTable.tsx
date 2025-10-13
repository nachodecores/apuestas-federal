"use client";

import { useEffect, useState } from "react";

// Tipos de datos que vienen de la API de Draft FPL
interface LeagueEntry {
  entry_id: number;
  entry_name: string;
  id: number;
  player_first_name: string;
  player_last_name: string;
  short_name: string;
}

interface Standing {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number; // Puntos totales en la tabla H2H
}

interface ApiMatch {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
}

interface DraftLeagueData {
  league: {
    name: string;
  };
  league_entries: LeagueEntry[];
  standings: Standing[];
  matches: ApiMatch[];
}

// Tipo para mostrar en la tabla (datos ya procesados)
interface PlayerDisplay {
  position: number;
  name: string;
  teamName: string;
  points: number;
  record: string; // ej: "6-1-0" (ganados-empatados-perdidos)
  balance: number;
  recentForm: ('win' | 'draw' | 'loss')[]; // Últimos 5 resultados
}

// Función para calcular racha de los últimos N partidos
function getRecentForm(league_entry_id: number, allMatches: ApiMatch[], count: number = 5): ('win' | 'draw' | 'loss')[] {
  const teamMatches = allMatches
    .filter(m => m.finished && (m.league_entry_1 === league_entry_id || m.league_entry_2 === league_entry_id))
    .sort((a, b) => b.event - a.event) // Más recientes primero
    .slice(0, count);
  
  return teamMatches.map(match => {
    const isTeam1 = match.league_entry_1 === league_entry_id;
    const teamPoints = isTeam1 ? match.league_entry_1_points : match.league_entry_2_points;
    const oppPoints = isTeam1 ? match.league_entry_2_points : match.league_entry_1_points;
    
    if (teamPoints > oppPoints) return 'win';
    if (teamPoints === oppPoints) return 'draw';
    return 'loss';
  });
}

export default function StandingsTable() {
  // Estados: guardan los datos y el estado de carga
  const [players, setPlayers] = useState<PlayerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameweek, setGameweek] = useState(7); // GW actual
  
  // useEffect: se ejecuta cuando el componente se monta (aparece en pantalla)
  useEffect(() => {
    // Función asíncrona para traer los datos
    async function fetchLeagueData() {
      try {
        // 1. Hacemos la petición a NUESTRA API (que hace de proxy)
        // Esto evita problemas de CORS porque llamamos a nuestro propio servidor
        const response = await fetch('/api/league');
        
        // 2. Verificamos que la respuesta sea exitosa
        if (!response.ok) {
          throw new Error('Error al obtener datos de la liga');
        }
        
        // 3. Convertimos la respuesta a JSON
        const data: DraftLeagueData = await response.json();
        
        // 4. Procesamos los datos: combinamos league_entries con standings
        const processedPlayers: PlayerDisplay[] = data.standings.map((standing) => {
          // Buscamos la info del jugador correspondiente
          const entry = data.league_entries.find(
            (e) => e.id === standing.league_entry
          );
          
          // Calculamos la racha de los últimos 5 partidos
          const recentForm = getRecentForm(standing.league_entry, data.matches, 5);
          
          return {
            position: standing.rank,
            name: entry ? `${entry.player_first_name} ${entry.player_last_name}` : 'Desconocido',
            teamName: entry?.entry_name || 'Sin nombre',
            points: standing.points_for,
            record: `${standing.matches_won}-${standing.matches_drawn}-${standing.matches_lost}`,
            balance: 10000, // Por ahora mock, después lo calcularemos según apuestas
            recentForm
          };
        });
        
        // 5. Guardamos los datos procesados en el estado
        setPlayers(processedPlayers);
        setLoading(false);
        
      } catch (err) {
        // Si hay error, lo mostramos
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    }
    
    // Ejecutamos la función
    fetchLeagueData();
  }, []); // [] significa: ejecutar solo una vez al montar el componente
  
  // Mientras está cargando, mostramos un spinner
  if (loading) {
    return (
      <section className="py-20 bg-[#ebe5eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[#37003c] text-xl">Cargando tabla de posiciones...</div>
        </div>
      </section>
    );
  }
  
  // Si hay error, lo mostramos
  if (error) {
    return (
      <section className="py-20 bg-[#ebe5eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      </section>
    );
  }
  
  // Renderizamos la tabla con los datos reales
  return (
    <section className="py-20 bg-[#ebe5eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl sm:text-4xl font-black text-[#37003c]">
            Tabla de Posiciones
          </h3>
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left bg-gray-50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    CCP
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cuadro
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Récord
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    Últimos 5
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Puntos
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, idx) => (
                  <tr
                    key={player.position}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-[#00ff87] text-black' : 
                        idx === 1 ? 'bg-[#ff2882] text-white' :
                        idx === 2 ? 'bg-[#37003c] text-white' :
                        'bg-white/10 text-white'
                      }`}>
                        {player.position}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-semibold">{player.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 text-sm">{player.teamName}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-700 font-mono text-sm">{player.record}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 justify-center">
                        {[...player.recentForm].reverse().map((result, formIdx) => (
                          <div
                            key={formIdx}
                            className={`w-6 h-6 rounded-full ${
                              result === 'win' ? 'bg-green-500' :
                              result === 'draw' ? 'bg-gray-400' :
                              'bg-red-500'
                            }`}
                            title={result === 'win' ? 'Victoria' : result === 'draw' ? 'Empate' : 'Derrota'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[#37003c] font-bold">{player.points}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        player.balance > 1000 ? 'text-[#00ff87]' : 'text-[#ff2882]'
                      }`}>
                        ${player.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}



