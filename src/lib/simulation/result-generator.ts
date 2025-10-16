// Módulo de simulación - SE PUEDE ELIMINAR CUANDO YA NO SE NECESITE
// Genera resultados de partidos basados en odds

export interface SimulatedResult {
  match_id: string;
  league_entry_1: number;
  league_entry_2: number;
  result: 'home' | 'draw' | 'away';
  home_score?: number;
  away_score?: number;
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
}

/**
 * Genera un resultado simulado basado en las odds
 * @param odds - Las odds del partido
 * @returns Resultado simulado
 */
export function generateSimulatedResult(
  league_entry_1: number,
  league_entry_2: number,
  odds: MatchOdds
): SimulatedResult {
  // Calcular probabilidades basadas en odds
  const homeProbability = 1 / odds.home;
  const drawProbability = 1 / odds.draw;
  const awayProbability = 1 / odds.away;
  
  // Normalizar probabilidades
  const totalProbability = homeProbability + drawProbability + awayProbability;
  const normalizedHome = homeProbability / totalProbability;
  const normalizedDraw = drawProbability / totalProbability;
  const normalizedAway = awayProbability / totalProbability;
  
  // Generar número aleatorio
  const random = Math.random();
  
  let result: 'home' | 'draw' | 'away';
  
  if (random < normalizedHome) {
    result = 'home';
  } else if (random < normalizedHome + normalizedDraw) {
    result = 'draw';
  } else {
    result = 'away';
  }
  
  // Generar scores opcionales (para simulación más realista)
  const homeScore = result === 'home' ? Math.floor(Math.random() * 3) + 1 : 
                   result === 'draw' ? Math.floor(Math.random() * 2) : 
                   Math.floor(Math.random() * 2);
  
  const awayScore = result === 'away' ? Math.floor(Math.random() * 3) + 1 : 
                   result === 'draw' ? homeScore : 
                   Math.floor(Math.random() * 2);
  
  return {
    match_id: `${league_entry_1}_vs_${league_entry_2}`,
    league_entry_1,
    league_entry_2,
    result,
    home_score: homeScore,
    away_score: awayScore
  };
}

/**
 * Genera resultados simulados para una lista de partidos
 * @param matches - Array de partidos con odds
 * @returns Array de resultados simulados
 */
export function generateSimulatedResults(matches: Array<{
  league_entry_1: number;
  league_entry_2: number;
  odds: MatchOdds;
}>): SimulatedResult[] {
  return matches.map(match => 
    generateSimulatedResult(match.league_entry_1, match.league_entry_2, match.odds)
  );
}
