// Cliente de Supabase para el navegador (client-side)
// Este archivo se usa en componentes "use client"

import { createBrowserClient } from '@supabase/ssr';

// Singleton para evitar múltiples instancias
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Si ya existe una instancia, la reutilizamos
  if (supabaseClient) {
    return supabaseClient;
  }

  // Creamos una nueva instancia solo si no existe
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

