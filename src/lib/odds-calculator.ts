// Sistema de cálculo de odds (cuotas) para apuestas
// Basado en: posición, puntos totales, racha reciente

interface Standing {
  league_entry: number;
  rank: number;
  points_for: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  total: number;
}

interface Match {
  event: number;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
  finished: boolean;
}

interface Odds {
  home: number;   // Cuota para victoria local
  draw: number;   // Cuota para empate
  away: number;   // Cuota para victoria visitante
}

export function calculateOdds(
  team1_id: number,
  team2_id: number,
  standings: Standing[],
  allMatches: Match[]
): Odds {
  // 1. Encontrar datos de ambos equipos
  const team1Standing = standings.find(s => s.league_entry === team1_id);
  const team2Standing = standings.find(s => s.league_entry === team2_id);
  
  if (!team1Standing || !team2Standing) {
    // Odds por defecto si no encontramos datos
    return { home: 2.0, draw: 4.0, away: 2.0 };
  }

  // 2. Calcular factores de probabilidad

  // Factor de posición (peso: 30%)
  // Mejor posición = menor número de rank
  const positionFactor = calculatePositionFactor(team1Standing.rank, team2Standing.rank);
  
  // Factor de puntos totales (peso: 25%)
  const pointsFactor = calculatePointsFactor(team1Standing.points_for, team2Standing.points_for);
  
  // Factor de racha reciente - últimos 5 partidos (peso: 30%)
  const formFactor = calculateFormFactor(team1_id, team2_id, allMatches);
  
  // Factor de récord general (peso: 15%)
  const recordFactor = calculateRecordFactor(team1Standing, team2Standing);

  // 3. Combinar factores para obtener probabilidad base
  const team1Probability = (
    positionFactor * 0.30 +
    pointsFactor * 0.25 +
    formFactor * 0.30 +
    recordFactor * 0.15
  );
  
  // Probabilidad del equipo 2 es el complemento
  const team2Probability = 1 - team1Probability;
  
  // 4. Calcular odds
  // Empate tiene probabilidad baja (10-15% típicamente en Draft FPL)
  const drawProbability = 0.12; // 12% de probabilidad de empate
  
  // Ajustar probabilidades de victoria para incluir empates
  const adjustedTeam1Prob = team1Probability * (1 - drawProbability);
  const adjustedTeam2Prob = team2Probability * (1 - drawProbability);
  
  // Convertir probabilidad a odds: odds = 1 / probabilidad
  // Agregamos un margen de la casa del 5%
  const margin = 1.05;
  
  const homeOdds = Math.max(1.1, (1 / adjustedTeam1Prob) * margin);
  const drawOdds = Math.max(3.0, (1 / drawProbability) * margin); // Mínimo 3.0 para empates
  const awayOdds = Math.max(1.1, (1 / adjustedTeam2Prob) * margin);
  
  return {
    home: Math.round(homeOdds * 100) / 100,  // Redondear a 2 decimales
    draw: Math.round(drawOdds * 100) / 100,
    away: Math.round(awayOdds * 100) / 100,
  };
}

// Factor basado en posición en la tabla
function calculatePositionFactor(rank1: number, rank2: number): number {
  // Si ambos están cerca, factor cercano a 0.5
  // Si team1 está mucho mejor (menor rank), factor > 0.5
  const maxRank = 10;
  const team1Score = (maxRank - rank1 + 1) / maxRank;
  const team2Score = (maxRank - rank2 + 1) / maxRank;
  
  const total = team1Score + team2Score;
  return team1Score / total;
}

// Factor basado en puntos totales
function calculatePointsFactor(points1: number, points2: number): number {
  const total = points1 + points2;
  return total > 0 ? points1 / total : 0.5;
}

// Factor basado en récord (victorias/derrotas)
function calculateRecordFactor(team1: Standing, team2: Standing): number {
  const team1WinRate = team1.matches_won / (team1.matches_won + team1.matches_lost + team1.matches_drawn || 1);
  const team2WinRate = team2.matches_won / (team2.matches_won + team2.matches_lost + team2.matches_drawn || 1);
  
  const total = team1WinRate + team2WinRate;
  return total > 0 ? team1WinRate / total : 0.5;
}

// Factor basado en racha (últimos 5 partidos)
function calculateFormFactor(
  team1_id: number,
  team2_id: number,
  allMatches: Match[]
): number {
  // Obtener últimos 5 partidos de cada equipo
  const team1Recent = getRecentMatches(team1_id, allMatches, 5);
  const team2Recent = getRecentMatches(team2_id, allMatches, 5);
  
  // Calcular puntos promedio en los últimos 5
  const team1AvgPoints = team1Recent.reduce((sum, m) => sum + m.points, 0) / Math.max(team1Recent.length, 1);
  const team2AvgPoints = team2Recent.reduce((sum, m) => sum + m.points, 0) / Math.max(team2Recent.length, 1);
  
  // Calcular victorias en últimos 5
  const team1RecentWins = team1Recent.filter(m => m.result === 'win').length;
  const team2RecentWins = team2Recent.filter(m => m.result === 'win').length;
  
  // Combinar puntos promedio y victorias
  const team1FormScore = (team1AvgPoints * 0.6) + (team1RecentWins * 10);
  const team2FormScore = (team2AvgPoints * 0.6) + (team2RecentWins * 10);
  
  const total = team1FormScore + team2FormScore;
  return total > 0 ? team1FormScore / total : 0.5;
}

// Obtener últimos N partidos de un equipo
function getRecentMatches(teamId: number, allMatches: Match[], count: number) {
  const teamMatches = allMatches
    .filter(m => m.finished && (m.league_entry_1 === teamId || m.league_entry_2 === teamId))
    .sort((a, b) => b.event - a.event) // Más recientes primero
    .slice(0, count);
  
  return teamMatches.map(match => {
    const isTeam1 = match.league_entry_1 === teamId;
    const teamPoints = isTeam1 ? match.league_entry_1_points : match.league_entry_2_points;
    const opponentPoints = isTeam1 ? match.league_entry_2_points : match.league_entry_1_points;
    
    let result: 'win' | 'draw' | 'loss';
    if (teamPoints > opponentPoints) result = 'win';
    else if (teamPoints === opponentPoints) result = 'draw';
    else result = 'loss';
    
    return {
      gameweek: match.event,
      points: teamPoints,
      result
    };
  });
}

