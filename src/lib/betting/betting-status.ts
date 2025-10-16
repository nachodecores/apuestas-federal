// Sistema de estado de apuestas basado en deadline de FPL

export interface BettingStatus {
  is_open: boolean;
  current_gameweek: number;
  deadline: string;
  deadline_passed: boolean;
  time_until_deadline: number; // en milisegundos
  message: string;
}

export interface FPLDeadlineInfo {
  current_gameweek: number;
  deadline: string;
  is_estimated: boolean;
}

/**
 * Obtiene el estado actual de las apuestas basado en el deadline de FPL
 */
export async function getBettingStatus(): Promise<BettingStatus> {
  try {
    // Obtener deadline de FPL
    const response = await fetch('/api/fpl/deadline');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Error obteniendo deadline de FPL');
    }
    
    const deadlineInfo: FPLDeadlineInfo = data;
    const deadline = new Date(deadlineInfo.deadline);
    const now = new Date();
    
    const deadline_passed = now > deadline;
    const time_until_deadline = deadline.getTime() - now.getTime();
    
    let message = '';
    if (deadline_passed) {
      message = `Las apuestas para la Gameweek ${deadlineInfo.current_gameweek} están cerradas. El deadline era el ${deadline.toLocaleString('es-AR')}`;
    } else {
      const hours = Math.floor(time_until_deadline / (1000 * 60 * 60));
      const minutes = Math.floor((time_until_deadline % (1000 * 60 * 60)) / (1000 * 60));
      message = `Apuestas abiertas para Gameweek ${deadlineInfo.current_gameweek}. Cierran en ${hours}h ${minutes}m`;
    }
    
    return {
      is_open: !deadline_passed,
      current_gameweek: deadlineInfo.current_gameweek,
      deadline: deadlineInfo.deadline,
      deadline_passed,
      time_until_deadline,
      message
    };
    
  } catch (error) {
    console.error('Error obteniendo estado de apuestas:', error);
    
    // Fallback: asumir que las apuestas están abiertas
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    nextSunday.setHours(18, 30, 0, 0);
    
    return {
      is_open: true,
      current_gameweek: 1,
      deadline: nextSunday.toISOString(),
      deadline_passed: false,
      time_until_deadline: nextSunday.getTime() - now.getTime(),
      message: 'Apuestas abiertas (usando deadline estimado)'
    };
  }
}

/**
 * Verifica si las apuestas están abiertas
 */
export async function areBetsOpen(): Promise<boolean> {
  const status = await getBettingStatus();
  return status.is_open;
}

/**
 * Obtiene la gameweek actual para apostar
 */
export async function getCurrentBettingGameweek(): Promise<number> {
  const status = await getBettingStatus();
  return status.current_gameweek;
}
