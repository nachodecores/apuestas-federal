/**
 * ENDPOINT: GET /api/fpl/deadline
 * 
 * PROPÓSITO:
 * Obtiene el deadline de la gameweek activa desde la FPL API estándar.
 * 
 * RESPUESTAS:
 * - 200: Deadline de la gameweek activa
 * - 404: No hay gameweek activa
 * - 500: Error al obtener deadline
 * 
 * USADO POR:
 * - /api/bets/create para validar deadline antes de crear apuesta
 * - Componentes del frontend para mostrar countdown
 * 
 * LÓGICA:
 * 1. Obtener gameweek activa desde gameweek_matches
 * 2. Consultar FPL API estándar (bootstrap-static)
 * 3. Buscar deadline para esa gameweek
 * 4. Retornar deadline_time
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Obtener gameweek activa desde gameweek_matches
    const { data: activeGwData, error: gwError } = await supabase
      .from('gameweek_matches')
      .select('gameweek')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    if (gwError) {
      throw new Error(`Error al obtener gameweek activa: ${gwError.message}`);
    }
    
    if (!activeGwData?.gameweek) {
      return NextResponse.json({
        success: false,
        error: 'No hay gameweek activa'
      }, { status: 404 });
    }
    
    const currentGameweek = activeGwData.gameweek;
    
    // 2. Consultar FPL API estándar para obtener deadlines
    const fplResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    
    if (!fplResponse.ok) {
      throw new Error(`Error al obtener datos de FPL API: ${fplResponse.status}`);
    }
    
    const fplData = await fplResponse.json();
    
    // 3. Buscar deadline para la gameweek activa
    const gameweekEvent = fplData.events?.find((event: any) => event.id === currentGameweek);
    
    if (!gameweekEvent) {
      return NextResponse.json({
        success: false,
        error: `No se encontró información de deadline para la Gameweek ${currentGameweek}`
      }, { status: 404 });
    }
    
    // 4. Retornar deadline
    return NextResponse.json({
      success: true,
      current_gameweek: currentGameweek,
      deadline: gameweekEvent.deadline_time,
      deadline_time_epoch: new Date(gameweekEvent.deadline_time).getTime(),
      is_estimated: false
    });
    
  } catch (error) {
    console.error('Error en /api/fpl/deadline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

