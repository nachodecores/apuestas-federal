import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el betId del body
    const { betId } = await request.json();
    
    console.log('🔍 DELETE: Intentando eliminar apuesta:', betId);
    console.log('🔍 DELETE: Usuario:', user.id);
    console.log('🔍 DELETE: Email del usuario:', user.email);
    
    if (!betId) {
      return NextResponse.json({ error: 'betId es requerido' }, { status: 400 });
    }

    // Verificar que la apuesta pertenece al usuario actual
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .eq('user_id', user.id)
      .single();

    if (betError || !bet) {
      console.error('❌ Apuesta no encontrada:', betError);
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }

    console.log('✅ Apuesta encontrada:', {
      id: bet.id,
      user_id: bet.user_id,
      status: bet.status,
      amount: bet.amount,
      gameweek: bet.gameweek
    });

    // Verificar que la apuesta esté pendiente (no se pueden eliminar apuestas resueltas)
    if (bet.status !== 'pending') {
      console.error('❌ Apuesta no está pendiente:', bet.status);
      return NextResponse.json({ error: 'No se pueden eliminar apuestas resueltas' }, { status: 400 });
    }

    // 1. Eliminar transacciones relacionadas primero
    console.log('🔍 DELETE: Eliminando transacciones para betId:', betId);
    const { data: deletedTransactions, error: transDeleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('related_bet_id', betId)
      .select(); // Agregar .select() para ver qué se eliminó

    if (transDeleteError) {
      console.error('❌ Error al eliminar transacciones:', transDeleteError);
      return NextResponse.json({ error: 'Error al eliminar transacciones' }, { status: 500 });
    }
    console.log('✅ Transacciones eliminadas exitosamente:', deletedTransactions);

    // 2. Eliminar la apuesta
    console.log('🔍 DELETE: Eliminando apuesta:', betId);
    const { data: deletedData, error: deleteError } = await supabase
      .from('bets')
      .delete()
      .eq('id', betId)
      .eq('user_id', user.id)
      .select(); // Agregar .select() para ver qué se eliminó

    if (deleteError) {
      console.error('❌ Error al eliminar apuesta:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la apuesta' }, { status: 500 });
    }
    console.log('✅ Apuesta eliminada exitosamente:', deletedData);

    // Devolver el monto para actualizar el balance
    return NextResponse.json({ 
      success: true, 
      refundAmount: bet.amount 
    });

  } catch (error) {
    console.error('Error en delete bet API:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
