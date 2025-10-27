/**
 * VALIDACIONES COMUNES DE API
 * 
 * Este archivo contiene funciones de validación reutilizables
 * para validar datos de entrada en los endpoints.
 * 
 * FUNCIONES:
 * - validateBetAmount(): Valida que el monto de apuesta sea válido
 * - validateGameweek(): Valida que el gameweek sea un número válido
 * - validatePrediction(): Valida que la predicción sea válida
 */

/**
 * Valida que el monto de apuesta sea válido
 * @param amount - Monto a validar
 * @param minAmount - Monto mínimo permitido (default: 1)
 * @returns Error string si es inválido, null si es válido
 */
export function validateBetAmount(amount: number, minAmount: number = 1): string | null {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'El monto debe ser un número válido';
  }
  
  if (amount < minAmount) {
    return `El monto mínimo es ₣${minAmount}`;
  }
  
  if (amount <= 0) {
    return 'El monto debe ser mayor a 0';
  }
  
  return null;
}

/**
 * Valida que el gameweek sea un número válido
 * @param gameweek - Gameweek a validar
 * @returns Error string si es inválido, null si es válido
 */
export function validateGameweek(gameweek: any): string | null {
  const gw = Number(gameweek);
  
  if (isNaN(gw)) {
    return 'Gameweek debe ser un número';
  }
  
  if (gw < 1 || gw > 38) {
    return 'Gameweek debe estar entre 1 y 38';
  }
  
  return null;
}

/**
 * Valida que la predicción sea válida
 * @param prediction - Predicción a validar
 * @returns Error string si es inválida, null si es válida
 */
export function validatePrediction(prediction: any): string | null {
  const validPredictions = ['home', 'draw', 'away'];
  
  if (!validPredictions.includes(prediction)) {
    return 'Predicción debe ser "home", "draw" o "away"';
  }
  
  return null;
}

/**
 * Valida que el balance del usuario sea suficiente
 * @param userBalance - Balance actual del usuario
 * @param requiredAmount - Monto requerido
 * @returns Error string si es insuficiente, null si es suficiente
 */
export function validateSufficientBalance(userBalance: number, requiredAmount: number): string | null {
  if (userBalance < requiredAmount) {
    return `Balance insuficiente. Tienes ₣${userBalance} y necesitas ₣${requiredAmount}`;
  }
  
  return null;
}

