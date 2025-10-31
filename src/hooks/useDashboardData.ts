/**
 * CUSTOM HOOK: useDashboardData
 * 
 * PROPÓSITO:
 * Maneja toda la lógica de carga de datos del dashboard:
 * - Perfil del usuario
 * - Apuestas del usuario (o todas si es admin)
 * - Detección de rol de admin
 * 
 * PARÁMETROS:
 * @param user - Usuario autenticado de Supabase
 * @param isOpen - Si el modal está abierto (para controlar cuándo cargar)
 * 
 * RETORNA:
 * - profile: Perfil del usuario
 * - allBets: Todas las apuestas del usuario (o globales si es admin)
 * - activeBets: Apuestas con status='pending'
 * - isAdmin: Si el usuario es administrador
 * - allUsersBets: Todas las apuestas de todos los usuarios (solo admin)
 * - allUsersMap: Mapa de usuarios con sus nombres e iniciales
 * - dataLoading: Estado de carga
 * - refreshData: Función para recargar datos
 * 
 * EJEMPLO DE USO:
 * const { profile, activeBets, isAdmin, dataLoading } = useDashboardData(user, isOpen);
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ROLES } from '@/constants/roles';
import type { User } from '@supabase/supabase-js';
import { DashboardData } from '@/types';

export function useDashboardData(user: User | null, isOpen: boolean): DashboardData {
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any | null>(null);
  const [allBets, setAllBets] = useState<any[]>([]);
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsersBets, setAllUsersBets] = useState<any[]>([]);
  const [allUsersMap, setAllUsersMap] = useState(new Map());
  const [dataLoading, setDataLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user || !isOpen) return;
    
    setDataLoading(true);
    
    try {
      // 1. Obtener gameweek activa
      const { data: activeGwData } = await supabase
        .from('gameweek_matches')
        .select('gameweek')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const activeGameweek = activeGwData?.gameweek ?? null;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      
      setProfile(profileData);

      // 2. Detectar si es admin
      const adminStatus = profileData?.role_id === ROLES.ADMIN;
      setIsAdmin(adminStatus);

      // 3. Cargar apuestas según el rol (solo si hay gameweek activa)
      if (!activeGameweek) {
        setAllBets([]);
        setActiveBets([]);
        setAllUsersBets([]);
        setAllUsersMap(new Map());
        return;
      }

      if (adminStatus) {
        // Admin: cargar TODAS las apuestas de todos los usuarios
        const { data: allBetsData } = await supabase
          .from('bets')
          .select(`
            *,
            profiles!bets_user_id_fkey (
              display_name,
              fpl_entry_id
            )
          `)
          .eq('status', 'pending')
          .eq('gameweek', activeGameweek)
          .order('created_at', { ascending: false });
        
        setAllUsersBets(allBetsData || []);
        
        // Filtrar apuestas activas globales (ya filtradas por gameweek)
        const globalActive = allBetsData || [];
        setActiveBets(globalActive);
        
        // Crear mapa de usuarios
        const usersMap = new Map();
        allBetsData?.forEach(bet => {
          if (bet.profiles) {
            usersMap.set(bet.user_id, {
              name: bet.profiles.display_name,
              initials: bet.profiles.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'N/A'
            });
          }
        });
        setAllUsersMap(usersMap);
        
        // Para admin, usar las apuestas globales
        setAllBets(allBetsData || []);
      } else {
        // Usuario normal: solo sus apuestas
        const { data: betsData } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .eq('gameweek', activeGameweek)
          .order('created_at', { ascending: false });
        
        setAllBets(betsData || []);
        
        // Filtrar apuestas activas (ya filtradas por gameweek)
        const active = betsData || [];
        setActiveBets(active);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user, isOpen]);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (!user || !isOpen) {
      setDataLoading(false);
      // Limpiar datos cuando no hay usuario
      setProfile(null);
      setAllBets([]);
      setActiveBets([]);
      setAllUsersBets([]);
      setAllUsersMap(new Map());
      return;
    }
    
    loadDashboardData();
  }, [user?.id, isOpen, loadDashboardData]);

  return {
    profile,
    allBets,
    activeBets,
    isAdmin,
    allUsersBets,
    allUsersMap,
    dataLoading,
    refreshData: loadDashboardData
  };
}

