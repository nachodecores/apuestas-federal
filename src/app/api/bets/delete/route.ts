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
      console.error('DELETE /api/bets/delete - Auth error:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el betId del body
    let betId;
    try {
      const body = await request.json();
      betId = body.betId;
    } catch (parseError) {
      console.error('DELETE /api/bets/delete - Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Formato de solicitud inválido' }, { status: 400 });
    }
    
    if (!betId) {
      console.error('DELETE /api/bets/delete - betId missing');
      return NextResponse.json({ error: 'betId es requerido' }, { status: 400 });
    }

    console.log('DELETE /api/bets/delete - Attempting to delete bet:', betId, 'User:', user.id);

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
      console.error('DELETE /api/bets/delete - Bet not found:', betError);
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
      console.error('DELETE /api/bets/delete - Error deleting transactions:', transDeleteError);
      return NextResponse.json({ error: 'Error al eliminar transacciones', details: transDeleteError.message }, { status: 500 });
    }
    
    // Verificar si realmente se eliminó algo (puede que no haya transacciones, eso es OK)
    if (deletedTransactions && deletedTransactions.length > 0) {
      console.log('DELETE /api/bets/delete - Deleted', deletedTransactions.length, 'transactions');
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
      console.error('DELETE /api/bets/delete - Error deleting bet:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la apuesta', details: deleteError.message }, { status: 500 });
    }
    
    // Verificar si realmente se eliminó algo
    if (!deletedData || deletedData.length === 0) {
      console.error('DELETE /api/bets/delete - Bet deletion returned no data');
      return NextResponse.json({ error: 'No se pudo eliminar la apuesta' }, { status: 500 });
    }

    console.log('DELETE /api/bets/delete - Bet deleted successfully:', betId);

    // 3. Devolver el monto al balance del dueño de la apuesta
    // Si es admin eliminando apuesta de otro usuario, usar Service Role para bypass RLS
    let supabaseForUpdate = supabase;
    if (isAdmin && bet.user_id !== user.id) {
      const { createServiceClient } = await import('@/lib/supabase/server');
      supabaseForUpdate = createServiceClient();
    }

    const { data: ownerProfile, error: ownerErr } = await supabaseForUpdate
      .from('profiles')
      .select('federal_balance')
      .eq('id', bet.user_id)
      .single();

    if (!ownerErr && ownerProfile) {
      const newBalance = (ownerProfile.federal_balance || 0) + (bet.amount || 0);
      const { error: updErr } = await supabaseForUpdate
        .from('profiles')
        .update({ federal_balance: newBalance })
        .eq('id', bet.user_id);

      if (updErr) {
        console.error('DELETE /api/bets/delete - Error updating balance:', updErr);
        // No fallar aquí, la apuesta ya se eliminó, solo loguear el error
      } else {
        console.log('DELETE /api/bets/delete - Balance updated for user:', bet.user_id);
      }
    } else {
      console.error('DELETE /api/bets/delete - Error fetching owner profile:', ownerErr);
      // No fallar aquí, la apuesta ya se eliminó, solo loguear el error
    }

    // Devolver el monto para actualizar el balance en UI
    return NextResponse.json({ 
      success: true, 
      refundAmount: bet.amount 
    });

  } catch (error) {
    console.error('DELETE /api/bets/delete - Unexpected error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
