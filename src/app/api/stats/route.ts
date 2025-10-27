/**
 * ENDPOINT: GET /api/stats
 * 
 * PROPÓSITO:
 * Obtiene estadísticas generales para mostrar en el componente Hero.
 * 
 * RESPUESTAS:
 * - 200: Objeto con estadísticas:
 *   - currentGameweek: Número de gameweek actual
 *   - activeBets: Cantidad de apuestas pendientes
 *   - gwAmount: Monto total apostado en la gameweek actual
 *   - federalPool: Suma de todos los federal_balance
 *   - realPool: Suma de todos los real_balance
 * 
 * USADO POR:
 * - Hero.tsx
 * 
 * NOTA: Incluye fallbacks para todos los valores en caso de error.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        currentGameweek: 8,
        activeBets: 0,
        gwAmount: 0,
        federalPool: 0,
        realPool: 10000
      });
    }

    const supabase = await createClient();
    
    // 1. Obtener gameweek actual de la API de FPL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const apiResponse = await fetch(`${baseUrl}/api/league`);
    
    if (!apiResponse.ok) {
      console.error('Error fetching league data:', apiResponse.status);
      return NextResponse.json({ 
        currentGameweek: 8,
        activeBets: 0,
        gwAmount: 0,
        federalPool: 0,
        realPool: 10000
      });
    }
    
    const fplData = await apiResponse.json();
    
    // Encontrar el próximo gameweek (primer partido no terminado)
    const upcomingMatches = fplData.matches.filter((m: { finished: boolean }) => !m.finished);
    const currentGameweek = upcomingMatches.length > 0 ? upcomingMatches[0].event : 8;

    // 2. Contar apuestas activas (status='pending') - con fallback
    let activeBetsCount = 0;
    try {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      activeBetsCount = count || 0;
    } catch (error) {
      console.error('Error counting active bets:', error);
    }
    
    // 3. Sumar montos apostados en el gameweek actual - con fallback
    let gwAmount = 0;
    try {
      const { data: gwBets } = await supabase
        .from('bets')
        .select('amount')
        .eq('gameweek', currentGameweek)
        .eq('status', 'pending');
      
      gwAmount = gwBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;
    } catch (error) {
      console.error('Error calculating GW amount:', error);
    }

    // 4. Sumar todos los federal_balance (pozo federal) - con fallback
    let federalPool = 0;
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('federal_balance');
      
      federalPool = profiles?.reduce((sum, profile) => sum + (profile.federal_balance || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating federal pool:', error);
    }

    // 5. Sumar todos los real_balance (pozo real) - con fallback
    let realPool = 0;
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('real_balance');
      
      realPool = profiles?.reduce((sum, profile) => sum + (profile.real_balance || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating real pool:', error);
      realPool = 10000; // Fallback al valor hardcodeado anterior
    }

    return NextResponse.json({
      currentGameweek,
      activeBets: activeBetsCount,
      gwAmount,
      federalPool,
      realPool
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    // Retornar datos por defecto en caso de error
    return NextResponse.json({ 
      currentGameweek: 8,
      activeBets: 0,
      gwAmount: 0,
      federalPool: 0,
      realPool: 10000
    });
  }
}
