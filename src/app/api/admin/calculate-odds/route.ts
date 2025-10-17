import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateAndSaveGameweekOdds } from '@/lib/odds/odds-calculator';

// POST /api/admin/calculate-odds
// Calcula y guarda las odds para un gameweek específico
export async function POST(request: Request) {
  try {
    // Verificar autenticación de admin
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar que el usuario sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.display_name !== 'Ignacio de Cores') {
      return NextResponse.json(
        { error: 'Solo administradores pueden calcular odds' },
        { status: 403 }
      );
    }
    
    // Obtener gameweek del body
    const { gameweek } = await request.json();
    
    if (!gameweek || typeof gameweek !== 'number') {
      return NextResponse.json(
        { error: 'Gameweek es requerido y debe ser un número' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 Iniciando cálculo de odds para GW${gameweek}...`);
    
    // Calcular y guardar las odds
    const odds = await calculateAndSaveGameweekOdds(gameweek);
    
    return NextResponse.json({
      success: true,
      message: `Odds calculadas exitosamente para GW${gameweek}`,
      gameweek,
      odds_count: odds.length,
      odds: odds
    });
    
  } catch (error) {
    console.error('Error calculando odds:', error);
    return NextResponse.json(
      { 
        error: 'Error calculando odds',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
