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
        
        const totalWon = wonBets.reduce((sum, bet) => sum + bet.potential_win, 0);
        const totalLost = lostBets.reduce((sum, bet) => sum + bet.amount, 0);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Welcome card */}
        <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2">
            ¡Bienvenido, {profile?.display_name || user.email}!
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            Tu cuenta está lista para empezar a apostar
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Balance */}
          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Tu balance</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#00ff87]">
              ${profile?.balance?.toFixed(2) || "0"}
            </div>
          </div>

          {/* Apuestas activas */}
          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Apuestas activas</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{activeBets.length}</div>
          </div>

          {/* Victorias */}
          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Apuestas ganadas</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ff2882]">{stats.wonBets.length}</div>
          </div>

          {/* Ganancia neta */}
          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Ganancia neta</div>
            <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${stats.netProfit >= 0 ? 'text-[#00ff87]' : 'text-red-500'}`}>
              ${stats.netProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Apuestas activas */}
        {activeBets.length > 0 ? (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Apuestas Activas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {activeBets.map((bet) => {
                const team1 = teamMap.get(bet.match_league_entry_1);
                const team2 = teamMap.get(bet.match_league_entry_2);
                
                let predictionText = '';
                if (bet.prediction === 'home') predictionText = `Gana ${team1?.name || 'Local'}`;
                else if (bet.prediction === 'away') predictionText = `Gana ${team2?.name || 'Visitante'}`;
                else predictionText = 'Empate';

                return (
                  <div
                    key={bet.id}
                    className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-[#ff2882]/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-[0.625rem] sm:text-xs text-gray-400 uppercase tracking-wider">
                        GW{bet.gameweek}
                      </span>
                      <span className="text-[0.625rem] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[#00ff87]/10 text-[#00ff87]">
                        En juego
                      </span>
                    </div>

                    {/* Equipos */}
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="text-center flex-1">
                        {team1?.logo ? (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full mx-auto mb-0.5 sm:mb-1 overflow-hidden bg-white border border-white/20 sm:border-2">
                            <Image
                              src={`/assets/${team1.logo}`}
                              alt={team1.name || 'Team 1'}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-0.5 sm:mb-1 flex items-center justify-center text-white font-bold text-[0.625rem] sm:text-xs">
                            {team1?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'T1'}
                          </div>
                        )}
                        <div className="text-white text-[0.625rem] sm:text-xs font-semibold truncate">
                          {team1?.name || 'Equipo 1'}
                        </div>
                      </div>
                      
                      <div className="text-gray-600 font-black text-xs sm:text-sm px-1 sm:px-2">VS</div>
                      
                      <div className="text-center flex-1">
                        {team2?.logo ? (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full mx-auto mb-0.5 sm:mb-1 overflow-hidden bg-white border border-white/20 sm:border-2">
                            <Image
                              src={`/assets/${team2.logo}`}
                              alt={team2.name || 'Team 2'}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#37003c] to-[#00ff87] mx-auto mb-0.5 sm:mb-1 flex items-center justify-center text-white font-bold text-[0.625rem] sm:text-xs">
                            {team2?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'T2'}
                          </div>
                        )}
                        <div className="text-white text-[0.625rem] sm:text-xs font-semibold truncate">
                          {team2?.name || 'Equipo 2'}
                        </div>
                      </div>
                    </div>

                    {/* Predicción */}
                    <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-[#ff2882]/10 border border-[#ff2882]/20">
                      <div className="text-[0.625rem] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Tu predicción</div>
                      <div className="text-xs sm:text-sm font-bold text-[#ff2882]">{predictionText}</div>
                    </div>

                    {/* Apuesta y ganancia */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-400">Apostado:</span>
                        <span className="text-white font-bold ml-1">${bet.amount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Posible:</span>
                        <span className="text-[#00ff87] font-bold ml-1">
                          ${bet.potential_win.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 sm:mt-2 text-[0.625rem] sm:text-xs text-gray-500 text-right">
                      Cuota: {bet.odds.toFixed(2)}x
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4 sm:mb-6 md:mb-8 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">No tenés apuestas activas</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
              Andá a la página principal para hacer apuestas en los próximos partidos
            </p>
            <Link
              href="/"
              className="inline-block px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl gradient-fpl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity"
            >
              Ver próximos partidos
            </Link>
          </div>
        )}

        {/* Historial de apuestas */}
        {(stats.wonBets.length > 0 || stats.lostBets.length > 0) && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Historial</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[0.625rem] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        GW
                      </th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[0.625rem] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Resultado
                      </th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-[0.625rem] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Apostado
                      </th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-[0.625rem] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                                className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[0.625rem] sm:text-xs font-semibold ${
                                  isWon
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {isWon ? '✓ Ganada' : '✗ Perdida'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-white font-semibold">
                              ${bet.amount.toFixed(2)}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-bold">
                              <span className={isWon ? 'text-[#00ff87]' : 'text-red-500'}>
                                {isWon ? '+' : '-'}${isWon ? bet.potential_win.toFixed(2) : bet.amount.toFixed(2)}
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
      </div>
    </div>
  );
}

