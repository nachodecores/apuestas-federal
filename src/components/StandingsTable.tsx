"use client";

import { useEffect, useState } from "react";
import { useLeague } from "@/contexts/LeagueContext";
import { LeagueEntry, Standing, ApiMatch, DraftLeagueData, PlayerDisplay } from "@/types";

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
  // Usar el contexto de liga
  const { leagueData, loading: contextLoading, error: contextError, fetchLeagueData, isDataLoaded } = useLeague();
  
  // Estados: guardan los datos y el estado de carga
  const [players, setPlayers] = useState<PlayerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // useEffect: se ejecuta cuando el componente se monta (aparece en pantalla)
  useEffect(() => {
    // Función asíncrona para procesar los datos
    async function processLeagueData() {
      try {
        // Verificar si hay datos disponibles
        if (!leagueData) {
          throw new Error('No hay datos de liga disponibles');
        }
        
        const data = leagueData;
        
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
            name: entry ? entry.player_first_name : 'Desconocido',
            teamName: entry?.entry_name || 'Sin nombre',
            h2hPoints: standing.total, // Puntos de la tabla H2H
            fplPoints: standing.points_for, // Puntos totales FPL
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
    processLeagueData();
  }, [leagueData, isDataLoaded, fetchLeagueData]); // Dependencias del contexto
  
  // Mientras está cargando, mostramos un spinner
  if (loading) {
    return (
      <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-2 mobile:px-3 tablet:px-4">
          <div className="text-[#37003c] text-sm mobile:text-base tablet:text-lg">Cargando tabla de posiciones...</div>
        </div>
      </section>
    );
  }
  
  // Si hay error, lo mostramos
  if (error) {
    return (
      <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
        <div className="h-full flex items-center justify-center px-2 mobile:px-3 tablet:px-4">
          <div className="text-red-500 text-sm mobile:text-base tablet:text-lg">Error: {error}</div>
        </div>
      </section>
    );
  }
  
  // Renderizamos la tabla con los datos reales
  return (
    <section className="bg-[#ebe5eb] h-full pb-4 mobile:pb-6 tablet:pb-8">
      <div className="h-full flex flex-col px-2 mobile:px-3 tablet:px-4">
        <div className="flex justify-between items-center mb-3 mobile:mb-4 tablet:mb-6">
          <h3 className="text-lg mobile:text-xl tablet:text-2xl font-black text-[#37003c]">
            Tabla de Posiciones
          </h3>
        </div>

        <div className="rounded-lg mobile:rounded-xl tablet:rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg flex-1 mx-2 mobile:mx-3 tablet:mx-4">
          <div className="overflow-x-auto h-full px-3 mobile:px-4 tablet:px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left bg-gray-50">
                  <th className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2">
                    {/* Columna vacía para posición sin header */}
                  </th>
                  <th className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-[0.5rem] mobile:text-[0.625rem] tablet:text-xs font-light text-gray-600 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="hidden tablet:table-cell px-3 py-2 text-xs font-light text-gray-600 uppercase tracking-wider text-right">
                    Récord
                  </th>
                  <th className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-[0.5rem] mobile:text-[0.625rem] tablet:text-xs font-light text-gray-600 uppercase tracking-wider text-center">
                    Racha
                  </th>
                  <th className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-[0.5rem] mobile:text-[0.625rem] tablet:text-xs font-light text-gray-600 uppercase tracking-wider text-right">
                    +
                  </th>
                  <th className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-[0.5rem] mobile:text-[0.625rem] tablet:text-xs font-light text-gray-600 uppercase tracking-wider text-right">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr
                    key={player.position}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Posición */}
                    <td className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2">
                      <span className="font-light text-[0.625rem] mobile:text-xs tablet:text-sm text-gray-700">
                        {player.position}
                      </span>
                    </td>
                    
                    {/* Equipo y jugador */}
                    <td className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-semibold text-[0.625rem] mobile:text-xs tablet:text-sm truncate max-w-[6rem] mobile:max-w-[8rem] tablet:max-w-none">
                          {player.teamName}
                        </span>
                        {/* Mostrar manager name (bajo el equipo) */}
                        <span className="text-gray-900 font-bold text-[0.5rem] mobile:text-[0.625rem] tablet:text-xs truncate max-w-[6rem] mobile:max-w-[8rem] tablet:max-w-none">
                          {player.name}
                        </span>
                      </div>
                    </td>
                    
                    
                    {/* Récord - oculto en mobile y tablet */}
                    <td className="hidden tablet:table-cell px-3 py-2 text-right">
                      <span className="text-gray-700 font-light font-mono text-xs">{player.record}</span>
                    </td>
                    
                    {/* Racha (Últimos 5) - VISIBLE en mobile */}
                    <td className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2">
                      <div className="flex gap-0.5 mobile:gap-1 justify-center">
                        {[...player.recentForm].reverse().map((result, formIdx) => (
                          <div
                            key={formIdx}
                            className={`w-2 h-2 mobile:w-3 mobile:h-3 tablet:w-4 tablet:h-4 rounded-full ${
                              result === 'win' ? 'bg-green-500' :
                              result === 'draw' ? 'bg-gray-400' :
                              'bg-red-500'
                            }`}
                            title={result === 'win' ? 'Victoria' : result === 'draw' ? 'Empate' : 'Derrota'}
                          />
                        ))}
                      </div>
                    </td>
                    
                    {/* Puntos FPL (+) - VISIBLE en mobile */}
                    <td className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-right">
                      <span className="text-[#37003c] font-light text-[0.625rem] mobile:text-xs tablet:text-sm">{player.fplPoints}</span>
                    </td>
                    
                    {/* Puntos H2H (Pts) - VISIBLE en mobile */}
                    <td className="px-1 py-1 mobile:px-2 mobile:py-2 tablet:px-3 tablet:py-2 text-right">
                      <span className="text-gray-700 font-light text-[0.625rem] mobile:text-xs tablet:text-sm">{player.h2hPoints}</span>
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



