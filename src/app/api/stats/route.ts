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

export async function GET(request: Request) {
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
    
    // Verificar si hay usuario autenticado para devolver stats personales
    const { data: { user } } = await supabase.auth.getUser();
    const isPersonal = !!user;
    
    // 1. Obtener gameweek activa desde gameweek_matches
    let currentGameweek = 8;
    try {
      const { data: activeGwData } = await supabase
        .from('gameweek_matches')
        .select('gameweek')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (activeGwData?.gameweek) {
        currentGameweek = activeGwData.gameweek;
      } else {
        // Fallback: obtener desde API de FPL
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const apiResponse = await fetch(`${baseUrl}/api/league`);
        if (apiResponse.ok) {
          const fplData = await apiResponse.json();
          const upcomingMatches = fplData.matches.filter((m: { finished: boolean }) => !m.finished);
          currentGameweek = upcomingMatches.length > 0 ? upcomingMatches[0].event : 8;
        }
      }
    } catch (error) {
      console.error('Error getting current gameweek:', error);
    }

    // 2. Contar apuestas activas según tipo (personales o globales)
    let activeBetsCount = 0;
    let gwAmount = 0;
    try {
      let betsQuery = supabase
        .from('bets')
        .select('amount', { count: 'exact' })
        .eq('gameweek', currentGameweek)
        .eq('status', 'pending');
      
      if (isPersonal && user) {
        // Stats personales: solo apuestas del usuario
        betsQuery = betsQuery.eq('user_id', user.id);
      }
      
      const { data: gwBets, count } = await betsQuery;
      
      activeBetsCount = count || 0;
      gwAmount = gwBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;
    } catch (error) {
      console.error('Error counting active bets:', error);
    }

    // 3. Calcular pools (personales o globales)
    let federalPool = 0;
    let realPool = 0;
    
    try {
      if (isPersonal && user) {
        // Stats personales: solo balance del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('federal_balance, real_balance')
          .eq('id', user.id)
          .single();
        
        federalPool = profile?.federal_balance || 0;
        realPool = profile?.real_balance || 10000;
      } else {
        // Stats globales: suma de todos los balances
        const { data: profiles } = await supabase
          .from('profiles')
          .select('federal_balance, real_balance');
        
        federalPool = profiles?.reduce((sum, profile) => sum + (profile.federal_balance || 0), 0) || 0;
        realPool = profiles?.reduce((sum, profile) => sum + (profile.real_balance || 0), 0) || 10000;
      }
    } catch (error) {
      console.error('Error calculating pools:', error);
      realPool = 10000;
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
