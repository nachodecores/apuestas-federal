// API Route para inicializar los 10 usuarios
// Solo ejecutar UNA VEZ: ir a http://localhost:3000/api/init-users desde el navegador

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const USERS = [
  { name: 'Chacho Bonino', league_entry_id: 6753 },
  { name: 'Marcos Arocena', league_entry_id: 5156 },
  { name: 'Ignacio de Cores', league_entry_id: 38904 },
  { name: 'Manuel Domenech', league_entry_id: 44346 },
  { name: 'Juan Dehl', league_entry_id: 54556 },
  { name: 'Juan Francisco Sienra', league_entry_id: 5769 },
  { name: 'Felipe Migues', league_entry_id: 5997 },
  { name: 'Joaquin Sarachaga', league_entry_id: 6494 },
  { name: 'Javier Villaamil', league_entry_id: 6479 },
  { name: 'Ángel Cal', league_entry_id: 5865 },
];

export async function GET() {
  // Necesitamos Service Role Key
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return NextResponse.json({ 
      error: 'SUPABASE_SERVICE_ROLE_KEY no configurado',
      instructions: 'Agregá SUPABASE_SERVICE_ROLE_KEY a tu archivo .env.local. La encontrás en Supabase → Settings → API → service_role key'
    }, { status: 500 });
  }

  // Crear cliente con service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    const results = [];

    for (const user of USERS) {
      const email = `${user.league_entry_id}@bolichefederal.com`;
      
      // Crear usuario
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: '1234',
        email_confirm: true,
        user_metadata: {
          display_name: user.name,
          league_entry_id: user.league_entry_id,
        },
      });

      if (error) {
        // Si ya existe, no es error
        if (error.message.includes('already registered')) {
          results.push({ user: user.name, status: 'exists', email });
        } else {
          results.push({ user: user.name, status: 'error', message: error.message });
        }
      } else {
        results.push({ user: user.name, status: 'created', email, id: data.user?.id });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      message: '✅ Usuarios creados! Ya podés usar "¿Quién sos?" para login'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

