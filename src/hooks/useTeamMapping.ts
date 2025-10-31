/**
 * CUSTOM HOOK: useTeamMapping
 * 
 * PROPÓSITO:
 * Crea un mapa de equipos con sus nombres basándose en las apuestas activas.
 * Usa el LeagueContext para obtener los nombres reales de los equipos.
 * 
 * PARÁMETROS:
 * @param activeBets - Array de apuestas activas
 * @param getTeamName - Función del LeagueContext para obtener nombre del equipo
 * @param isDataLoaded - Si los datos de liga están cargados
 * 
 * RETORNA:
 * - teamMap: Map<number, { name: string, logo: string | null }>
 * 
 * EJEMPLO DE USO:
 * const teamMap = useTeamMapping(activeBets, getTeamName, isDataLoaded);
 * const team1 = teamMap.get(bet.match_league_entry_1);
 * console.log(team1?.name); // "Palmitas FC"
 */

import { useState, useEffect } from 'react';
import { TeamInfo } from '@/types';

export function useTeamMapping(
  activeBets: any[],
  getTeamName: (id: number) => string,
  isDataLoaded: boolean
): Map<number, TeamInfo> {
  const [teamMap, setTeamMap] = useState<Map<number, TeamInfo>>(new Map());

  useEffect(() => {
    // Solo actualizar si hay datos de liga y apuestas activas
    if (!isDataLoaded || activeBets.length === 0) return;

    
    // Obtener IDs únicos de equipos
    const teamIds = new Set<number>();
    activeBets.forEach((bet) => {
      teamIds.add(bet.match_league_entry_1);
      teamIds.add(bet.match_league_entry_2);
    });

    // Crear mapa de equipos
    if (teamIds.size > 0) {
      const newTeamMap = new Map<number, TeamInfo>();
      Array.from(teamIds).forEach(id => {
        const teamName = getTeamName(id);
        newTeamMap.set(id, { 
          name: teamName, 
          logo: null // TODO: Implementar logos de equipos
        });
      });
      setTeamMap(newTeamMap);
    }
  }, [isDataLoaded, activeBets, getTeamName]);

  return teamMap;
}

