import { createClient } from '@/lib/supabase/server';
import { calculateOdds } from '@/lib/odds-calculator';

// Tipos para las odds pre-calculadas
export interface GameweekOdds {
  id?: number;
  gameweek: number;
  league_entry_1: number;
  league_entry_2: number;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  calculated_at?: string;
  is_active?: boolean;
}

// Tipos de datos de la API
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

/**
 * Calcula y guarda las odds para un gameweek específico
 * @param gameweek - Número del gameweek
 * @returns Array de odds calculadas y guardadas
 */
export async function calculateAndSaveGameweekOdds(gameweek: number): Promise<GameweekOdds[]> {
  const supabase = await createClient();
  
  try {
    
    // 1. Obtener datos de la liga
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/league`);
    if (!response.ok) {
      throw new Error(`Error obteniendo datos de liga: ${response.status}`);
    }
    
    const data: DraftLeagueData = await response.json();
    
    // 2. Filtrar partidos del gameweek específico
    const gameweekMatches = data.matches.filter(match => match.event === gameweek);
    
    if (gameweekMatches.length === 0) {
      throw new Error(`No se encontraron partidos para GW${gameweek}`);
    }
    
    
    // 3. Desactivar odds anteriores para este gameweek
    await supabase
      .from('gameweek_odds')
      .update({ is_active: false })
      .eq('gameweek', gameweek);
    
    // 4. Calcular odds para cada partido
    const oddsToInsert: Omit<GameweekOdds, 'id' | 'calculated_at'>[] = [];
    
    for (const match of gameweekMatches) {
      const odds = calculateOdds(
        match.league_entry_1,
        match.league_entry_2,
        data.standings,
        data.matches
      );
      
      oddsToInsert.push({
        gameweek,
        league_entry_1: match.league_entry_1,
        league_entry_2: match.league_entry_2,
        home_odds: odds.home,
        draw_odds: odds.draw,
        away_odds: odds.away,
        is_active: true
      });
    }
    
    // 5. Insertar nuevas odds en la base de datos
    const { data: insertedOdds, error } = await supabase
      .from('gameweek_odds')
      .insert(oddsToInsert)
      .select();
    
    if (error) {
      throw new Error(`Error insertando odds: ${error.message}`);
    }
    
    
    return insertedOdds || [];
    
  } catch (error) {
    console.error(`💥 Error calculando odds para GW${gameweek}:`, error);
    throw error;
  }
}

/**
 * Obtiene las odds pre-calculadas para un gameweek
 * @param gameweek - Número del gameweek
 * @returns Array de odds o null si no existen
 */
export async function getGameweekOdds(gameweek: number): Promise<GameweekOdds[] | null> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('gameweek_odds')
      .select('*')
      .eq('gameweek', gameweek)
      .eq('is_active', true)
      .order('id');
    
    if (error) {
      throw new Error(`Error obteniendo odds: ${error.message}`);
    }
    
    return data && data.length > 0 ? data : null;
    
  } catch (error) {
    console.error(`💥 Error obteniendo odds para GW${gameweek}:`, error);
    return null;
  }
}

/**
 * Obtiene las odds para un partido específico
 * @param gameweek - Número del gameweek
 * @param league_entry_1 - ID del equipo local
 * @param league_entry_2 - ID del equipo visitante
 * @returns Odds del partido o null si no existen
 */
export async function getMatchOdds(
  gameweek: number, 
  league_entry_1: number, 
  league_entry_2: number
): Promise<GameweekOdds | null> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('gameweek_odds')
      .select('*')
      .eq('gameweek', gameweek)
      .eq('league_entry_1', league_entry_1)
      .eq('league_entry_2', league_entry_2)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el registro
        return null;
      }
      throw new Error(`Error obteniendo odds del partido: ${error.message}`);
    }
    
    return data;
    
  } catch (error) {
    console.error(`💥 Error obteniendo odds del partido:`, error);
    return null;
  }
}
