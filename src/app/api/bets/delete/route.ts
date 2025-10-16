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
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }

    // Verificar que la apuesta esté pendiente (no se pueden eliminar apuestas resueltas)
    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'No se pueden eliminar apuestas resueltas' }, { status: 400 });
    }

    // Eliminar la apuesta
    const { error: deleteError } = await supabase
      .from('bets')
      .delete()
      .eq('id', betId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error al eliminar apuesta:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la apuesta' }, { status: 500 });
    }

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
