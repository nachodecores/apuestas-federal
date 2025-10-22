"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLeague } from "@/contexts/LeagueContext";
import type { User } from "@supabase/supabase-js";
import { DashboardModalProps, DashboardStats } from "@/types";
import DeleteBetButton from "./DeleteBetButton";

export default function DashboardModal({ isOpen, onClose, user }: DashboardModalProps) {
  const supabase = createClient();
  
  // Usar el contexto de liga
  const { getTeamName, fetchLeagueData, isDataLoaded } = useLeague();
  
  // Estados del dashboard
  const [profile, setProfile] = useState(null);
  const [userTeamName, setUserTeamName] = useState<string>('');
  const [allBets, setAllBets] = useState([]);
  const [activeBets, setActiveBets] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsersBets, setAllUsersBets] = useState([]);
  const [allUsersMap, setAllUsersMap] = useState(new Map());
  const [stats, setStats] = useState<DashboardStats>({
    totalWon: 0,
    totalLost: 0,
    netProfit: 0,
    wonBets: [],
    lostBets: []
  });
  const [teamMap, setTeamMap] = useState(new Map());
  const [dataLoading, setDataLoading] = useState(true);

  // Estados para cambiar contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Resetear estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setProfile(null);
      setUserTeamName('');
      setAllBets([]);
      setActiveBets([]);
      setIsAdmin(false);
      setAllUsersBets([]);
      setAllUsersMap(new Map());
      setStats({
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        wonBets: [],
        lostBets: []
      });
      setTeamMap(new Map());
      setDataLoading(true);
    }
  }, [isOpen]);

  // Cargar datos del dashboard cuando se abre el modal
  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !isOpen) return;
      
      // Si ya tenemos datos y el modal se está abriendo, no recargar
      if (profile && allBets.length > 0 && isOpen) {
        setDataLoading(false);
        return;
      }

      // Los datos de liga se cargarán automáticamente por el contexto

      setDataLoading(true);
      try {
        // Obtener el perfil del usuario
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Detectar si es admin
        const adminStatus = profileData?.display_name === 'Ignacio de Cores';
        setIsAdmin(adminStatus);

        // Obtener nombre del equipo usando el contexto
        if (profileData?.fpl_entry_id) {
          const teamName = getTeamName(profileData.fpl_entry_id);
          setUserTeamName(teamName);
        }

        // Si es admin, cargar TODAS las apuestas de todos los usuarios
        if (adminStatus) {
          // Obtener TODAS las apuestas de todos los usuarios
          const { data: allBetsData } = await supabase
            .from("bets")
            .select(`
              *,
              profiles!bets_user_id_fkey (
                display_name,
                fpl_entry_id
              )
            `)
            .order("created_at", { ascending: false });
          
          setAllUsersBets(allBetsData || []);
          
          // Filtrar apuestas activas globales
          const globalActive = allBetsData?.filter((bet) => bet.status === "pending") || [];
          setActiveBets(globalActive);
          
          // Crear mapa de usuarios
          const usersMap = new Map();
          allBetsData?.forEach(bet => {
            if (bet.profiles) {
              usersMap.set(bet.user_id, {
                name: bet.profiles.display_name,
                initials: bet.profiles.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'N/A'
              });
            }
          });
          setAllUsersMap(usersMap);
          
          // Para admin, usar las apuestas globales para estadísticas
          setAllBets(allBetsData || []);
        } else {
          // Usuario normal - obtener solo sus apuestas
          const { data: betsData } = await supabase
            .from("bets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          setAllBets(betsData || []);

          // Filtrar apuestas activas (status='pending')
          const active = betsData?.filter((bet) => bet.status === "pending") || [];
          setActiveBets(active);
        }

        // Calcular estadísticas
        const currentBets = adminStatus ? allUsersBets : allBets;
        const wonBets = currentBets?.filter((bet) => bet.status === "won") || [];
        const lostBets = currentBets?.filter((bet) => bet.status === "lost") || [];
        
        const totalWon = wonBets.reduce((sum, bet) => sum + (bet.potential_win || 0), 0);
        const totalLost = lostBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
        const netProfit = totalWon - totalLost;

        setStats({
          totalWon,
          totalLost,
          netProfit,
          wonBets,
          lostBets
        });

        // Los nombres de equipos se actualizarán cuando los datos de liga estén cargados
        // (manejado por el useEffect que escucha isDataLoaded)
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id, isOpen]); // Solo depende del ID del usuario y si está abierto

  // Actualizar nombres de equipos cuando los datos de liga estén cargados
  useEffect(() => {
    if (isDataLoaded && activeBets.length > 0) {
      console.log('🔍 DashboardModal: Actualizando nombres de equipos...');
      const teamIds = new Set();
      activeBets.forEach((bet) => {
        teamIds.add(bet.match_league_entry_1);
        teamIds.add(bet.match_league_entry_2);
      });

      if (teamIds.size > 0) {
        const newTeamMap = new Map();
        Array.from(teamIds).forEach(id => {
          const teamName = getTeamName(Number(id));
          console.log('🔍 DashboardModal: Mapeando equipo:', id, '->', teamName);
          newTeamMap.set(id, { 
            name: teamName, 
            logo: null
          });
        });
        setTeamMap(newTeamMap);
      }
    }
  }, [isDataLoaded, activeBets, getTeamName]);


  // Función para cerrar sesión
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      onClose(); // Cerrar el modal
      // El Header se encargará de redirigir o actualizar la UI
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Intentalo de nuevo.');
    }
  }

  // Función para cambiar contraseña
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setChangingPassword(true);

    try {
      // Validaciones
      if (newPassword !== confirmNewPassword) {
        setPasswordError('Las contraseñas no coinciden');
        setChangingPassword(false);
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
        setChangingPassword(false);
        return;
      }


      // Cambiar contraseña en Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error al cambiar contraseña:', error);
        throw error;
      }

      if (!data.user) {
        console.error('No se recibió usuario actualizado');
        throw new Error('Error: No se pudo actualizar el usuario');
      }


      // Éxito
      alert('¡Contraseña cambiada exitosamente!');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error) {
      console.error('Error completo en cambio de contraseña:', error);
      
      let errorMessage = 'Error al cambiar contraseña';
      
      if (error instanceof Error) {
        // Mensajes de error más específicos y amigables
        if (error.message.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres (requerido por Supabase)';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Credenciales inválidas. Por favor, volvé a iniciar sesión.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email no confirmado. Contactá al administrador.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setPasswordError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  }

  // Cerrar modal con ESC
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-start justify-center z-[9999] p-4 pt-8"
      onClick={onClose}
    >
        <div 
          className="rounded-lg sm:rounded-xl overflow-hidden flex flex-col w-full max-w-6xl relative"
          style={{
            height: '80vh',
            maxHeight: '80vh',
            marginTop: '2rem',
            background: `
              linear-gradient(rgba(255, 255, 255, 0) 240px, white 360px), 
              linear-gradient(to right, rgb(2, 239, 255), rgb(98, 123, 255))
            `,
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundRepeat: 'no-repeat, no-repeat'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar - Esquina superior derecha */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-black hover:text-gray-700 transition-colors text-3xl font-bold"
          >
            ×
          </button>

          {/* Header del modal */}
          <div className="flex items-center p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {/* Avatar del equipo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white flex-shrink-0">
                {profile?.team_logo ? (
                  <Image
                    src={`/assets/${profile.team_logo}`}
                    alt={profile.display_name || 'Equipo'}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
                    {profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CC'}
                  </div>
                )}
              </div>
              
              {/* Información del manager */}
              <div className="flex flex-col" style={{ alignItems: 'flex-start' }}>
                <div 
                  className="text-xs uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-b inline-block"
                  style={{
                    backgroundColor: '#37003c',
                    color: '#05f0ff',
                    width: 'fit-content'
                  }}
                >
                  CCP
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  {profile?.display_name || user?.email || 'Manager'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {userTeamName || 'Equipo'}
                </div>
              </div>
            </div>
          </div>

        {/* Contenido del modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 text-lg">Cargando dashboard...</div>
            </div>
          ) : (
            <>
              {/* Stats unificadas */}
              <div 
                className="border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 relative overflow-hidden flex flex-row items-center justify-between"
                style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
              >
                <div className="relative z-10 flex-1 text-center">
                  <div className="text-xs text-gray-600 mb-1">Apuestas activas</div>
                  <div className="text-lg text-gray-900">{activeBets.length}</div>
                </div>
                
                <div className="w-px h-12" style={{ backgroundColor: 'rgb(20, 198, 236)' }}></div>
                
                <div className="relative z-10 flex-1 text-center">
                  <div className="text-xs text-gray-600 mb-1">Total apostado</div>
                  <div className="text-lg text-gray-900">
                    ${activeBets.reduce((sum, bet) => sum + (bet.amount || 0), 0).toFixed(0)}
                  </div>
                </div>
                
                <div className="w-px h-12" style={{ backgroundColor: 'rgb(20, 198, 236)' }}></div>
                
                <div className="relative z-10 flex-1 text-center">
                  <div className="text-xs text-gray-600 mb-1">Ganancia potencial</div>
                  <div className="text-lg text-gray-900">
                    ${stats.netProfit.toFixed(2)}
                  </div>
                </div>
                
                <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
              </div>

              {/* Apuestas activas */}
              {activeBets.length > 0 ? (
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <h3 className="text-lg sm:text-xl font-black text-[#37003c] mb-3 sm:mb-4">
                    {isAdmin ? 'Todas las Apuestas Activas' : 'Apuestas Activas'}
                  </h3>
                  <div 
                    className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-lg"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 text-left bg-gray-50">
                            {isAdmin && (
                              <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Usuario
                              </th>
                            )}
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Partido
                            </th>
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Predicción
                            </th>
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Apostado
                            </th>
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Posible
                            </th>
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Cuota
                            </th>
                            <th className="px-2 py-2 sm:px-3 sm:py-3 text-[0.625rem] sm:text-xs font-medium text-gray-600 uppercase tracking-wider text-center">
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBets.map((bet) => {
                            const team1 = teamMap.get(bet.match_league_entry_1);
                            const team2 = teamMap.get(bet.match_league_entry_2);
                            const userInfo = allUsersMap.get(bet.user_id);
                            
                            let predictionText = '';
                            if (bet.prediction === 'home') predictionText = 'Local';
                            else if (bet.prediction === 'away') predictionText = 'Visitante';
                            else predictionText = 'Empate';

                            return (
                              <tr
                                key={bet.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                {/* Usuario - Solo para admin */}
                                {isAdmin && (
                                  <td className="px-2 py-2 sm:px-3 sm:py-3">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                                      {userInfo?.initials || 'N/A'}
                                    </div>
                                  </td>
                                )}
                                
                                {/* Partido */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                                    {team1?.name || 'Local'} vs {team2?.name || 'Visitante'}
                                  </div>
                                </td>
                                
                                {/* Predicción */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    {predictionText}
                                  </span>
                                </td>
                                
                                {/* Apostado */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    ${bet.amount ? bet.amount.toFixed(2) : '0.00'}
                                  </span>
                                </td>
                                
                                {/* Posible */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                                  <span className="text-xs sm:text-sm font-medium text-[#00ff87]">
                                    ${bet.potential_win ? bet.potential_win.toFixed(2) : '0.00'}
                                  </span>
                                </td>
                                
                                {/* Cuota */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                                    {bet.odds ? bet.odds.toFixed(2) : 'N/A'}
                                  </span>
                                </td>
                                
                                {/* Botón eliminar - Para todos los usuarios */}
                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                                  <DeleteBetButton 
                                    betId={bet.id}
                                    userId={bet.user_id}
                                    variant="icon"
                                    size="sm"
                                    onDeleteSuccess={(betId, refundAmount) => {
                                      // Remove from local state
                                      setActiveBets(prev => prev.filter(b => b.id !== betId));
                                      if (isAdmin) {
                                        setAllUsersBets(prev => prev.filter(b => b.id !== betId));
                                      }
                                      
                                      // Update balance if it's the current user's bet
                                      const deletedBet = activeBets.find(b => b.id === betId);
                                      if (deletedBet && profile && deletedBet.user_id === user?.id) {
                                        setProfile(prev => prev ? { ...prev, balance: prev.balance + refundAmount } : null);
                                      }
                                    }}
                                    onDeleteError={(error) => {
                                      console.error('Error deleting bet:', error);
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="mb-4 sm:mb-6 md:mb-8 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center relative overflow-hidden"
                  style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
                >
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">No tenés apuestas activas</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      Andá a la página principal para hacer apuestas en los próximos partidos
                    </p>
                    <button
                      onClick={onClose}
                      className="inline-block px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity text-white"
                      style={{ background: 'linear-gradient(to right, #953bff, #02efff)' }}
                    >
                      Ver próximos partidos
                    </button>
                  </div>
                  <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
                </div>
              )}

              {/* Historial de apuestas */}
              {(stats.wonBets.length > 0 || stats.lostBets.length > 0) && (
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <h3 className="text-lg sm:text-xl font-black text-[#37003c] mb-3 sm:mb-4">Historial</h3>
                  <div className="border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                              GW
                            </th>
                            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                              Resultado
                            </th>
                            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                              Apostado
                            </th>
                            <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                              Ganancia
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {[...stats.wonBets, ...stats.lostBets]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 10)
                            .map((bet) => {
                              const isWon = bet.status === 'won';
                              
                              return (
                                <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                                    GW{bet.gameweek}
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                                    <span
                                      className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                                        isWon
                                          ? 'bg-green-500/10 text-green-500'
                                          : 'bg-red-500/10 text-red-500'
                                      }`}
                                    >
                                      {isWon ? '✓ Ganada' : '✗ Perdida'}
                                    </span>
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900 font-semibold">
                                    ${bet.amount ? bet.amount.toFixed(2) : '0.00'}
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-bold">
                                    <span className={isWon ? 'text-[#00ff87]' : 'text-red-500'}>
                                      {isWon ? '+' : '-'}${isWon ? (bet.potential_win ? bet.potential_win.toFixed(2) : '0.00') : (bet.amount ? bet.amount.toFixed(2) : '0.00')}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer con botones */}
              <div className="text-center mt-8 sm:mt-12 flex justify-center gap-6">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="text-gray-500 hover:text-[#ff2882] transition-colors text-sm font-medium"
                >
                  Cambiar contraseña
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cambiar contraseña</h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
                  placeholder="Tu contraseña actual"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
                  placeholder="Mínimo 6 caracteres (requerido por Supabase)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
                  placeholder="Repetí la nueva contraseña (mínimo 6 caracteres)"
                />
              </div>

              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(150, 60, 255)' }}
                >
                  {changingPassword ? 'Cambiando...' : 'Cambiar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
