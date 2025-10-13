import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Obtener todos los participantes
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('display_name, league_entry_id, team_logo, fpl_entry_id')
      .order('display_name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Error al obtener participantes' }, { status: 500 });
    }

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
