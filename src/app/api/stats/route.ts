import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Obtener gameweek actual de la API de FPL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const apiResponse = await fetch(`${baseUrl}/api/league`);
    const fplData = await apiResponse.json();
    
    // Encontrar el próximo gameweek (primer partido no terminado)
    const upcomingMatches = fplData.matches.filter((m: { finished: boolean }) => !m.finished);
    const currentGameweek = upcomingMatches.length > 0 ? upcomingMatches[0].event : 8;

    // 2. Contar apuestas activas (status='pending')
    const { count: activeBetsCount } = await supabase
      .from('bets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    // 3. Sumar montos apostados en el gameweek actual
    const { data: gwBets } = await supabase
      .from('bets')
      .select('amount')
      .eq('gameweek', currentGameweek)
      .eq('status', 'pending');
    
    const gwAmount = gwBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;

    // 4. Sumar todos los balances (pozo total)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('balance');
    
    const totalPool = profiles?.reduce((sum, profile) => sum + profile.balance, 0) || 0;

    return NextResponse.json({
      currentGameweek,
      activeBets: activeBetsCount || 0,
      gwAmount,
      totalPool
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
