import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Crear cliente con service role key para admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener todos los participantes
    const { data: participants, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, fpl_entry_id')
      .order('display_name');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      participants: participants || [],
      count: participants?.length || 0
    });

  } catch (error) {
    console.error('Error al listar participantes:', error);
    return NextResponse.json({
      error: 'Error al obtener participantes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
