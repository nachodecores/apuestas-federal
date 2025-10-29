/**
 * ENDPOINT: DELETE /api/bets/delete
 * 
 * PROPÓSITO:
 * Elimina una apuesta pendiente y devuelve el monto al usuario.
 * 
 * BODY:
 * {
 *   betId: string
 * }
 * 
 * RESPUESTAS:
 * - 200: Apuesta eliminada exitosamente, devuelve refundAmount
 * - 400: Apuesta no está pendiente o betId inválido
 * - 401: Usuario no autenticado
 * - 404: Apuesta no encontrada
 * - 500: Error al eliminar apuesta
 * 
 * USADO POR:
 * - DeleteBetButton.tsx
 * 
 * PERMISOS:
 * - Usuarios normales: Solo pueden eliminar sus propias apuestas
 * - Admins: Pueden eliminar cualquier apuesta
 * 
 * LÓGICA:
 * 1. Verifica autenticación
 * 2. Verifica si es admin
 * 3. Busca la apuesta (con restricción de usuario si no es admin)
 * 4. Verifica que esté pendiente
 * 5. Elimina transacciones asociadas
 * 6. Elimina la apuesta
 * 7. Devuelve monto apostado
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ROLES } from '@/constants/roles';

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

    // Verificar si el usuario es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role_id === ROLES.ADMIN;

    // Verificar que la apuesta existe
    let query = supabase
      .from('bets')
      .select('*')
      .eq('id', betId);

    // Solo agregar restricción de usuario si NO es admin
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: bet, error: betError } = await query.single();

    if (betError || !bet) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }


    // Verificar que la apuesta esté pendiente (no se pueden eliminar apuestas resueltas)
    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'No se pueden eliminar apuestas resueltas' }, { status: 400 });
    }

    // 1. Eliminar transacciones relacionadas primero
    
    let transDeleteQuery;
    if (isAdmin) {
      // Para admin, usar Service Role Key para bypass RLS
      const { createServiceClient } = await import('@/lib/supabase/server');
      const serviceSupabase = createServiceClient();
      transDeleteQuery = serviceSupabase
        .from('transactions')
        .delete()
        .eq('related_bet_id', betId)
        .select();
    } else {
      // Para usuario normal, usar cliente normal (con RLS)
      transDeleteQuery = supabase
        .from('transactions')
        .delete()
        .eq('related_bet_id', betId)
        .select();
    }

    const { data: deletedTransactions, error: transDeleteError } = await transDeleteQuery;

    if (transDeleteError) {
      return NextResponse.json({ error: 'Error al eliminar transacciones' }, { status: 500 });
    }
    
    // Verificar si realmente se eliminó algo
    if (deletedTransactions.length === 0) {
    }

    // 2. Eliminar la apuesta
    let deleteQuery = supabase
      .from('bets')
      .delete()
      .eq('id', betId);

    // Solo agregar restricción de usuario si NO es admin
    if (!isAdmin) {
      deleteQuery = deleteQuery.eq('user_id', user.id);
    }

    const { data: deletedData, error: deleteError } = await deleteQuery.select();

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar la apuesta' }, { status: 500 });
    }
    
    // Verificar si realmente se eliminó algo
    if (deletedData.length === 0) {
      return NextResponse.json({ error: 'No se pudo eliminar la apuesta' }, { status: 500 });
    }

    // Devolver el monto para actualizar el balance
    return NextResponse.json({ 
      success: true, 
      refundAmount: bet.amount 
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
