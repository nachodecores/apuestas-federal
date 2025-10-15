import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const supabase = await createClient();
    
    // Obtener todos los participantes con timeout
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('display_name, league_entry_id, team_logo, fpl_entry_id')
      .order('display_name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ 
        error: 'Error al obtener participantes',
        details: error.message 
      }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found, returning default data');
      // Datos por defecto si no hay perfiles
      const defaultProfiles = [
        { display_name: 'Chacho Bonino', league_entry_id: 6753, team_logo: null, fpl_entry_id: null },
        { display_name: 'Marcos Arocena', league_entry_id: 5156, team_logo: null, fpl_entry_id: null },
        { display_name: 'Ignacio de Cores', league_entry_id: 38904, team_logo: null, fpl_entry_id: null },
        { display_name: 'Manuel Domenech', league_entry_id: 44346, team_logo: null, fpl_entry_id: null },
        { display_name: 'Juan Dehl', league_entry_id: 54556, team_logo: null, fpl_entry_id: null },
        { display_name: 'Juan Francisco Sienra', league_entry_id: 5769, team_logo: null, fpl_entry_id: null },
        { display_name: 'Felipe Migues', league_entry_id: 5997, team_logo: null, fpl_entry_id: null },
        { display_name: 'Joaquin Sarachaga', league_entry_id: 6494, team_logo: null, fpl_entry_id: null },
        { display_name: 'Javier Villaamil', league_entry_id: 6479, team_logo: null, fpl_entry_id: null },
        { display_name: 'Ángel Cal', league_entry_id: 5865, team_logo: null, fpl_entry_id: null },
      ];
      return NextResponse.json({ profiles: defaultProfiles });
    }

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json({ 
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
