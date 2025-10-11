// Esta ruta maneja el callback de OAuth (Google)
// Cuando el usuario autoriza con Google, vuelve acá

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // Intercambiamos el código por una sesión
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirigir al dashboard después del login exitoso
  return NextResponse.redirect(`${origin}/dashboard`);
}

