/**
 * HELPERS DE AUTENTICACIÓN Y AUTORIZACIÓN
 * 
 * Este archivo contiene funciones reutilizables para verificar autenticación
 * y permisos de usuarios en los endpoints de API.
 * 
 * FUNCIONES:
 * - requireAuth(): Verifica que el usuario esté autenticado
 * - requireAdmin(): Verifica que el usuario sea administrador
 * - getUserProfile(): Obtiene el perfil completo del usuario
 */

import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/constants/roles';
import type { User } from '@supabase/supabase-js';

/**
 * Verifica que el usuario esté autenticado
 * @returns Usuario autenticado o null si no está autenticado
 */
export async function requireAuth(): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { user: null, error: 'No autorizado' };
  }
  
  return { user, error: null };
}

/**
 * Verifica que el usuario sea administrador
 * @param userId - ID del usuario a verificar
 * @returns true si es admin, false si no lo es
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', userId)
    .single();
  
  return profile?.role_id === ROLES.ADMIN;
}

/**
 * Verifica que el usuario sea administrador y devuelve error si no lo es
 * @param userId - ID del usuario a verificar
 * @returns Error string si no es admin, null si es admin
 */
export async function requireAdmin(userId: string): Promise<string | null> {
  const isAdmin = await isUserAdmin(userId);
  
  if (!isAdmin) {
    return 'Se requieren permisos de administrador';
  }
  
  return null;
}

/**
 * Obtiene el perfil completo del usuario desde Supabase
 * @param userId - ID del usuario
 * @returns Perfil del usuario o null si no existe
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error obteniendo perfil:', error);
    return null;
  }
  
  return profile;
}

