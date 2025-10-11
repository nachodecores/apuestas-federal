import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Cerrar sesión
  await supabase.auth.signOut();
  
  // Redirigir al home
  return NextResponse.redirect(new URL('/', request.url));
}

