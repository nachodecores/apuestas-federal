// Cliente de Supabase para el navegador (client-side)
// Este archivo se usa en componentes "use client"

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Creamos el cliente de Supabase con las credenciales del .env.local
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

