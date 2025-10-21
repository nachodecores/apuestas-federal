"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LeagueEntry, Standing, ApiMatch } from '@/types';

interface LeagueData {
  league_entries: LeagueEntry[];
  standings: Standing[];
  matches: ApiMatch[];
  gameweek?: number;
}

interface LeagueContextType {
  leagueData: LeagueData | null;
  loading: boolean;
  error: string | null;
  fetchLeagueData: () => Promise<void>;
  getTeamName: (leagueEntryId: number) => string;
  getPlayerName: (leagueEntryId: number) => string;
  isDataLoaded: boolean;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagueData = useCallback(async () => {
    console.log('🔍 DEBUG: fetchLeagueData iniciado');
    console.log('🔍 DEBUG: Estado actual - loading:', loading, 'error:', error, 'leagueData:', !!leagueData);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 DEBUG: Haciendo fetch a /api/league');
      const response = await fetch('/api/league');
      
      console.log('🔍 DEBUG: Respuesta recibida - status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 DEBUG: Datos parseados - keys:', Object.keys(data));
      console.log('🔍 DEBUG: league_entries length:', data.league_entries?.length);
      console.log('🔍 DEBUG: matches length:', data.matches?.length);
      console.log('🔍 DEBUG: standings length:', data.standings?.length);
      
      setLeagueData(data);
      console.log('🔍 DEBUG: leagueData establecido en el estado');
    } catch (err) {
      console.log('🔍 DEBUG: Error capturado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener datos de la liga';
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('🔍 DEBUG: fetchLeagueData completado - loading: false');
    }
  }, []);

  const getTeamName = useCallback((leagueEntryId: number): string => {
    if (!leagueData) return 'Sin equipo';
    const entry = leagueData.league_entries.find(e => e.id === leagueEntryId);
    return entry?.entry_name || 'Sin equipo';
  }, [leagueData]);

  const getPlayerName = useCallback((leagueEntryId: number): string => {
    if (!leagueData) return 'Sin nombre';
    const entry = leagueData.league_entries.find(e => e.id === leagueEntryId);
    return entry ? `${entry.player_first_name} ${entry.player_last_name}` : 'Sin nombre';
  }, [leagueData]);

  const isDataLoaded = !!leagueData;

  // Los datos se cargan desde page.tsx para garantizar disponibilidad

  return (
    <LeagueContext.Provider value={{
      leagueData,
      loading,
      error,
      fetchLeagueData,
      getTeamName,
      getPlayerName,
      isDataLoaded
    }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague debe usarse dentro de LeagueProvider');
  }
  return context;
}
