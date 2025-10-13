import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Bet {
  id: string;
  gameweek: number;
  match_league_entry_1: number;
  match_league_entry_2: number;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  potential_win: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtenemos el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect("/login");
  }

  // Obtener el perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Obtener TODAS las apuestas del usuario (ordenadas por fecha)
  const { data: allBets } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Filtrar apuestas activas (status='pending')
  const activeBets = allBets?.filter((bet) => bet.status === "pending") || [];

  // Calcular estadísticas
  const wonBets = allBets?.filter((bet) => bet.status === "won") || [];
  const lostBets = allBets?.filter((bet) => bet.status === "lost") || [];
  
  const totalWon = wonBets.reduce((sum, bet) => sum + bet.potential_win, 0);
  const totalLost = lostBets.reduce((sum, bet) => sum + bet.amount, 0);
  const netProfit = totalWon - totalLost;

  // Obtener nombres de equipos para las apuestas activas
  const teamIds = new Set<number>();
  activeBets.forEach((bet) => {
    teamIds.add(bet.match_league_entry_1);
    teamIds.add(bet.match_league_entry_2);
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("league_entry_id, display_name, team_logo")
    .in("league_entry_id", Array.from(teamIds));

  const teamMap = new Map(
    profiles?.map((p) => [p.league_entry_id, { name: p.display_name, logo: p.team_logo }]) || []
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link 
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image 
              src="/assets/logopremierclaro.svg"
              alt="Premier League"
              width={40}
              height={50}
              className="h-10 w-auto"
            />
            <h1 className="text-2xl text-white">
              <span className="font-black">Bet</span>
              <span className="font-normal"> Federal</span>
            </h1>
          </Link>
          
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-[#ff2882]/10 border border-[#ff2882]/50 text-[#ff2882] hover:bg-[#ff2882]/20 transition-colors font-semibold"
            >
              Admin
            </Link>
            <form action="/auth/signout" method="post">
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-black text-white mb-2">
            ¡Bienvenido, {profile?.display_name || user.email}!
          </h2>
          <p className="text-gray-400">
            Tu cuenta está lista para empezar a apostar
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Balance */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Tu balance</div>
            <div className="text-4xl font-black text-[#00ff87]">
              ${profile?.balance?.toFixed(2) || "0"}
            </div>
          </div>

          {/* Apuestas activas */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Apuestas activas</div>
            <div className="text-4xl font-black text-white">{activeBets.length}</div>
          </div>

          {/* Victorias */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Apuestas ganadas</div>
            <div className="text-4xl font-black text-[#ff2882]">{wonBets.length}</div>
          </div>

          {/* Ganancia neta */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Ganancia neta</div>
            <div className={`text-4xl font-black ${netProfit >= 0 ? 'text-[#00ff87]' : 'text-red-500'}`}>
              ${netProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Apuestas activas */}
        {activeBets.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white mb-4">Apuestas Activas</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#ff2882]/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">
                        GW{bet.gameweek}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-[#00ff87]/10 text-[#00ff87]">
                        En juego
                      </span>
                    </div>

                    {/* Equipos */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        {team1?.logo ? (
                          <div className="w-10 h-10 rounded-full mx-auto mb-1 overflow-hidden bg-white border-2 border-white/20">
                            <Image
                              src={`/assets/${team1.logo}`}
                              alt={team1.name || 'Team 1'}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs">
                            {team1?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T1'}
                          </div>
                        )}
                        <div className="text-white text-xs font-semibold truncate">
                          {team1?.name || 'Equipo 1'}
                        </div>
                      </div>
                      
                      <div className="text-gray-600 font-black text-sm px-2">VS</div>
                      
                      <div className="text-center flex-1">
                        {team2?.logo ? (
                          <div className="w-10 h-10 rounded-full mx-auto mb-1 overflow-hidden bg-white border-2 border-white/20">
                            <Image
                              src={`/assets/${team2.logo}`}
                              alt={team2.name || 'Team 2'}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#37003c] to-[#00ff87] mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs">
                            {team2?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T2'}
                          </div>
                        )}
                        <div className="text-white text-xs font-semibold truncate">
                          {team2?.name || 'Equipo 2'}
                        </div>
                      </div>
                    </div>

                    {/* Predicción */}
                    <div className="mb-3 p-2 rounded-lg bg-[#ff2882]/10 border border-[#ff2882]/20">
                      <div className="text-xs text-gray-400 mb-1">Tu predicción</div>
                      <div className="text-sm font-bold text-[#ff2882]">{predictionText}</div>
                    </div>

                    {/* Apuesta y ganancia */}
                    <div className="flex items-center justify-between text-sm">
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
                    <div className="mt-2 text-xs text-gray-500 text-right">
                      Cuota: {bet.odds.toFixed(2)}x
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">No tenés apuestas activas</h3>
            <p className="text-gray-400 mb-4">
              Andá a la página principal para hacer apuestas en los próximos partidos
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl gradient-fpl font-bold hover:opacity-90 transition-opacity"
            >
              Ver próximos partidos
            </Link>
          </div>
        )}

        {/* Historial de apuestas */}
        {(wonBets.length > 0 || lostBets.length > 0) && (
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white mb-4">Historial</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        GW
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Resultado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Apostado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Ganancia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {[...wonBets, ...lostBets]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map((bet) => {
                        const isWon = bet.status === 'won';
                        const team1 = teamMap.get(bet.match_league_entry_1);
                        const team2 = teamMap.get(bet.match_league_entry_2);
                        
                        return (
                          <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-sm text-white">
                              GW{bet.gameweek}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  isWon
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {isWon ? '✓ Ganada' : '✗ Perdida'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-white font-semibold">
                              ${bet.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold">
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

