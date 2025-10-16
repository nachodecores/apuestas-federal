// Módulo principal de resolución de apuestas - PERMANENTE
// Resuelve apuestas basadas en resultados reales o simulados

export interface MatchResult {
  match_id: string;
  league_entry_1: number;
  league_entry_2: number;
  result: 'home' | 'draw' | 'away';
  home_score?: number;
  away_score?: number;
}

export interface BetResolution {
  bet_id: string;
  user_id: string;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  actual_result: 'home' | 'draw' | 'away';
  won: boolean;
  payout: number;
  profit_loss: number;
}

export interface ResolutionSummary {
  total_bets: number;
  winning_bets: number;
  losing_bets: number;
  total_payout: number;
  total_profit_loss: number;
  bet_resolutions: BetResolution[];
}

/**
 * Resuelve una apuesta individual
 * @param bet - La apuesta a resolver
 * @param result - El resultado del partido
 * @returns Resolución de la apuesta
 */
export function resolveBet(
  bet: {
    id: string;
    user_id: string;
    prediction: 'home' | 'draw' | 'away';
    amount: number;
    odds: number;
  },
  result: MatchResult
): BetResolution {
  const won = bet.prediction === result.result;
  const payout = won ? bet.amount * bet.odds : 0;
  const profit_loss = payout - bet.amount;
  
  return {
    bet_id: bet.id,
    user_id: bet.user_id,
    prediction: bet.prediction,
    amount: bet.amount,
    odds: bet.odds,
    actual_result: result.result,
    won,
    payout,
    profit_loss
  };
}

/**
 * Resuelve todas las apuestas de una gameweek
 * @param bets - Array de apuestas a resolver
 * @param results - Array de resultados de partidos
 * @returns Resumen de la resolución
 */
export function resolveGameweekBets(
  bets: Array<{
    id: string;
    user_id: string;
    prediction: 'home' | 'draw' | 'away';
    amount: number;
    odds: number;
    match_league_entry_1: number;
    match_league_entry_2: number;
  }>,
  results: MatchResult[]
): ResolutionSummary {
  const bet_resolutions: BetResolution[] = [];
  let total_bets = 0;
  let winning_bets = 0;
  let losing_bets = 0;
  let total_payout = 0;
  let total_profit_loss = 0;
  
  bets.forEach(bet => {
    // Encontrar el resultado correspondiente
    const result = results.find(r => 
      (r.league_entry_1 === bet.match_league_entry_1 && r.league_entry_2 === bet.match_league_entry_2) ||
      (r.league_entry_1 === bet.match_league_entry_2 && r.league_entry_2 === bet.match_league_entry_1)
    );
    
    if (result) {
      const resolution = resolveBet(bet, result);
      bet_resolutions.push(resolution);
      
      total_bets++;
      if (resolution.won) {
        winning_bets++;
      } else {
        losing_bets++;
      }
      total_payout += resolution.payout;
      total_profit_loss += resolution.profit_loss;
    }
  });
  
  return {
    total_bets,
    winning_bets,
    losing_bets,
    total_payout,
    total_profit_loss,
    bet_resolutions
  };
}
