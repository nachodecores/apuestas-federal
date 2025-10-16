import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Datos simulados para testing
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    nextSunday.setHours(18, 30, 0, 0);
    
    return NextResponse.json({
      success: true,
      current_gameweek: 1,
      deadline: nextSunday.toISOString(),
      is_estimated: true,
      league_info: {
        name: "Liga Federal",
        total_rosters: 10
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo deadline de FPL:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
