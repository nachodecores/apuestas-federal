// API Route para crear apuestas
// POST /api/bets/create

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Tipo de datos que recibimos del cliente
interface BetInput {
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  potential_win: number;
}

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

    // 3. Calcular total a apostar
    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    // 4. Obtener el perfil del usuario para verificar balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al obtener perfil del usuario' },
        { status: 500 }
      );
    }

    // 5. Verificar que tenga suficiente saldo
    if (profile.balance < totalAmount) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponible: $${profile.balance}, Necesario: $${totalAmount}` },
        { status: 400 }
      );
    }

    // 6. Crear las apuestas en la base de datos
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

    // 7. Actualizar el balance del usuario (restar el total apostado)
    const newBalance = profile.balance - totalAmount;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error al actualizar balance:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar balance' },
        { status: 500 }
      );
    }

    // 8. Crear transacciones para cada apuesta
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

    // 9. Retornar éxito
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

