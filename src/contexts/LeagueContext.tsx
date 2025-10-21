"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface LeagueEntry {
  id: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
}

interface Standing {
  league_entry: number;
  rank: number;
  total: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
}

interface Match {
  league_entry_1: number;
  league_entry_2: number;
  event: number;
  finished: boolean;
  started: boolean;
}

interface LeagueData {
  league_entries: LeagueEntry[];
  standings: Standing[];
  matches: Match[];
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
    if (leagueData) {
      console.log('📦 LeagueContext: Datos ya cargados, saltando fetch');
      return; // Ya tenemos datos
    }
    
    console.log('🚀 LeagueContext: Iniciando fetch de datos de liga...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/league');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ LeagueContext: Datos de liga obtenidos exitosamente');
      setLeagueData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener datos de la liga';
      console.error('💥 LeagueContext: Error obteniendo datos:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leagueData]);

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

  // Cargar datos automáticamente al montar el contexto
  useEffect(() => {
    if (!leagueData && !loading) {
      console.log('🚀 LeagueContext: Cargando datos automáticamente...');
      fetchLeagueData();
    }
  }, [leagueData, loading, fetchLeagueData]);

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
