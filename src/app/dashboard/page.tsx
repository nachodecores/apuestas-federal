"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Todos los hooks deben ir aquí, antes de cualquier early return
  const [profile, setProfile] = useState(null);
  const [allBets, setAllBets] = useState([]);
  const [activeBets, setActiveBets] = useState([]);
  const [stats, setStats] = useState({
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

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    
    getUser();
  }, [supabase, router]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        // Obtener el perfil del usuario
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Obtener TODAS las apuestas del usuario (ordenadas por fecha)
        const { data: betsData } = await supabase
          .from("bets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setAllBets(betsData || []);

        // Filtrar apuestas activas (status='pending')
        const active = betsData?.filter((bet) => bet.status === "pending") || [];
        setActiveBets(active);

        // Calcular estadísticas
        const wonBets = betsData?.filter((bet) => bet.status === "won") || [];
        const lostBets = betsData?.filter((bet) => bet.status === "lost") || [];
        
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

        // Obtener nombres de equipos para las apuestas activas
        const teamIds = new Set();
        active.forEach((bet) => {
          teamIds.add(bet.match_league_entry_1);
          teamIds.add(bet.match_league_entry_2);
        });

        if (teamIds.size > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("league_entry_id, display_name, team_logo")
            .in("league_entry_id", Array.from(teamIds));

          const newTeamMap = new Map(
            profilesData?.map((p) => [p.league_entry_id, { name: p.display_name, logo: p.team_logo }]) || []
          );
          setTeamMap(newTeamMap);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    loadDashboardData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  // Función para eliminar una apuesta
  async function handleDeleteBet(betId: string) {
    if (!confirm('¿Estás seguro que querés eliminar esta apuesta?')) {
      return;
    }

    try {
      const response = await fetch('/api/bets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la apuesta');
      }

      // Actualizar la lista local removiendo la apuesta eliminada
      setActiveBets(prev => prev.filter(bet => bet.id !== betId));
      
      // Actualizar el balance del usuario
      const deletedBet = activeBets.find(bet => bet.id === betId);
      if (deletedBet && profile) {
        setProfile(prev => prev ? { ...prev, balance: prev.balance + (deletedBet.amount || 0) } : null);
      }

      alert('Apuesta eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar apuesta:', error);
      alert('Error al eliminar la apuesta. Intentalo de nuevo.');
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

      console.log('Intentando cambiar contraseña para usuario:', user?.email);

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

      console.log('Contraseña cambiada exitosamente para:', data.user.email);

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

  return (
    <div className="min-h-screen bg-[#ebe5eb]">
      <Header />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Welcome card */}
        <div 
          className="border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 relative overflow-hidden"
          style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
        >
          <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-1 sm:mb-2">
                ¡Bienvenido, {profile?.display_name || user.email}!
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Saldo de tu cuenta: <span className="font-bold text-[#00ff87]">${profile?.balance?.toFixed(2) || "0"}</span>
              </p>
          </div>
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Apuestas activas */}
          <div 
            className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden"
            style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
          >
            <div className="relative z-10">
              <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">Apuestas activas</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">{activeBets.length}</div>
            </div>
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
          </div>

          {/* Total apostado GW actual */}
          <div 
            className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden"
            style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
          >
            <div className="relative z-10">
              <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">Total apostado GW</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ff2882]">
                ${activeBets.reduce((sum, bet) => sum + (bet.amount || 0), 0).toFixed(0)}
              </div>
            </div>
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#ff2882] to-[#953bff]"></div>
          </div>

          {/* Ganancia neta */}
          <div 
            className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden"
            style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
          >
            <div className="relative z-10">
              <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">Ganancia neta</div>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${stats.netProfit >= 0 ? 'text-[#00ff87]' : 'text-red-500'}`}>
                ${stats.netProfit.toFixed(2)}
              </div>
            </div>
            <div className={`absolute inset-0 opacity-5 ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-[#00ff87] to-[#02efff]' : 'bg-gradient-to-br from-red-500 to-[#ff2882]'}`}></div>
          </div>
        </div>

        {/* Apuestas activas */}
        {activeBets.length > 0 ? (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-[#37003c] mb-3 sm:mb-4">Apuestas Activas</h3>
            <div 
              className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-lg"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left bg-gray-50">
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
                      
                      let predictionText = '';
                      if (bet.prediction === 'home') predictionText = 'Local';
                      else if (bet.prediction === 'away') predictionText = 'Visitante';
                      else predictionText = 'Empate';

                      return (
                        <tr
                          key={bet.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {/* Partido */}
                          <td className="px-2 py-2 sm:px-3 sm:py-3">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[8rem] sm:max-w-none">
                              {team1?.name || 'Local'} vs {team2?.name || 'Visitante'}
                            </div>
                          </td>
                          
                          {/* Predicción */}
                          <td className="px-2 py-2 sm:px-3 sm:py-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] sm:text-xs font-medium bg-[#ff2882]/10 text-[#ff2882]">
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
                          
                          {/* Botón eliminar */}
                          <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                            <button
                              onClick={() => handleDeleteBet(bet.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center text-xs sm:text-sm font-bold"
                              title="Eliminar apuesta"
                            >
                              ×
                            </button>
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
              <Link
                href="/"
                className="inline-block px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity text-white"
                style={{ background: 'linear-gradient(to right, #953bff, #02efff)' }}
              >
                Ver próximos partidos
              </Link>
            </div>
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#953bff] to-[#02efff]"></div>
          </div>
        )}

        {/* Historial de apuestas */}
        {(stats.wonBets.length > 0 || stats.lostBets.length > 0) && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-[#37003c] mb-3 sm:mb-4">Historial</h3>
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
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white">
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
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-white font-semibold">
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

        {/* Footer con botón cambiar contraseña */}
        <div className="text-center mt-8 sm:mt-12">
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="text-gray-500 hover:text-[#ff2882] transition-colors text-sm font-medium"
          >
            Cambiar contraseña
          </button>
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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

