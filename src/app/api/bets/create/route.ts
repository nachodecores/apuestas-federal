/**
 * ENDPOINT: POST /api/bets/create
 * 
 * PROPÓSITO:
 * Crea una o múltiples apuestas para el usuario autenticado.
 * 
 * BODY:
 * {
 *   bets: Array<{
 *     gameweek: number,
 *     match_league_entry_1: number,
 *     match_league_entry_2: number,
 *     prediction: 'home' | 'draw' | 'away',
 *     amount: number,
 *     odds: number,
 *     potential_win: number
 *   }>
 * }
 * 
 * RESPUESTAS:
 * - 200: Apuestas creadas exitosamente
 * - 400: Datos inválidos o balance insuficiente
 * - 401: Usuario no autenticado
 * - 500: Error al crear apuestas
 * 
 * USADO POR:
 * - MatchCard.tsx
 * 
 * LÓGICA:
 * 1. Verifica autenticación
 * 2. Valida balance del usuario
 * 3. Descuenta monto del federal_balance
 * 4. Crea apuestas en DB
 * 5. Crea transacciones asociadas
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

import type { BetInput } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Obtener el usuario autenticado
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Recibir las apuestas del body
    const { bets }: { bets: BetInput[] } = await request.json();
    
    if (!bets || bets.length === 0) {
      return NextResponse.json(
        { error: 'No hay apuestas para crear' },
        { status: 400 }
      );
    }

    // 3. Validar que haya gameweek activa y que el deadline no haya pasado
    const { data: activeGwData, error: gwError } = await supabase
      .from('gameweek_matches')
      .select('gameweek')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    if (gwError) {
      console.error('Error al obtener gameweek activa:', gwError);
      return NextResponse.json(
        { error: 'Error al verificar gameweek activa' },
        { status: 500 }
      );
    }
    
    if (!activeGwData?.gameweek) {
      return NextResponse.json(
        { error: 'No hay gameweek activa. Las apuestas están cerradas.' },
        { status: 400 }
      );
    }

    // Verificar deadline desde FPL API
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      const deadlineResponse = await fetch(`${baseUrl}/api/fpl/deadline`);
      
      if (deadlineResponse.ok) {
        const deadlineData = await deadlineResponse.json();
        
        if (deadlineData.success && deadlineData.deadline) {
          const deadlineTime = new Date(deadlineData.deadline);
          const now = new Date();
          
          if (now > deadlineTime) {
            return NextResponse.json(
              { error: `Las apuestas para esta gameweek están cerradas. El deadline era el ${deadlineTime.toLocaleString('es-AR')}.` },
              { status: 400 }
            );
          }
        }
      } else {
        // Si no se puede obtener deadline, loguear pero no bloquear (fallback)
        console.warn('No se pudo obtener deadline, continuando sin validación');
      }
    } catch (deadlineError) {
      // Si hay error al obtener deadline, loguear pero no bloquear (fallback)
      console.warn('Error al validar deadline:', deadlineError);
    }

    // 4. Calcular total a apostar
    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    // 5. Obtener el perfil del usuario para verificar balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('federal_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al obtener perfil del usuario' },
        { status: 500 }
      );
    }

    // 6. Verificar que tenga suficiente saldo
    if (profile.federal_balance < totalAmount) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponible: F$${profile.federal_balance}, Necesario: F$${totalAmount}` },
        { status: 400 }
      );
    }

    // 7. Crear las apuestas en la base de datos
    const betsToInsert = bets.map(bet => ({
      user_id: user.id,
      gameweek: bet.gameweek,
      match_league_entry_1: bet.match_league_entry_1,
      match_league_entry_2: bet.match_league_entry_2,
      amount: bet.amount,
      prediction: bet.prediction,
      status: 'pending',
      odds: bet.odds, // Odds calculadas dinámicamente
      potential_win: bet.potential_win, // Ganancia = monto × odds
    }));

    const { data: createdBets, error: betsError } = await supabase
      .from('bets')
      .insert(betsToInsert)
      .select();

    if (betsError) {
      console.error('Error al crear apuestas:', betsError);
      return NextResponse.json(
        { error: 'Error al crear apuestas: ' + betsError.message },
        { status: 500 }
      );
    }

    // 8. Actualizar el balance del usuario (restar el total apostado)
    const newBalance = profile.federal_balance - totalAmount;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ federal_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error al actualizar balance:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar balance' },
        { status: 500 }
      );
    }

    // 9. Crear transacciones para cada apuesta
    const transactionsToInsert = createdBets.map((bet, idx) => ({
      user_id: user.id,
      amount: -bet.amount, // Negativo porque es un gasto
      type: 'bet_placed',
      related_bet_id: bet.id,
      balance_after: idx === betsToInsert.length - 1 ? newBalance : null, // Solo en la última
    }));

    const { error: transError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (transError) {
      console.error('Error al crear transacciones:', transError);
      // No retornamos error aquí, las apuestas ya se crearon
    }

    // 10. Retornar éxito
    return NextResponse.json({
      success: true,
      message: `${bets.length} apuesta(s) creada(s) exitosamente`,
      new_balance: newBalance,
      bets_created: createdBets.length
    });

  } catch (error) {
    console.error('Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar apuestas';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

