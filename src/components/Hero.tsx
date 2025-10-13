"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Hero() {
  const supabase = createClient();
  const [currentGameweek, setCurrentGameweek] = useState<number>(8);
  const [activeBets, setActiveBets] = useState<number>(0);
  const [gwAmount, setGwAmount] = useState<number>(0);
  const [totalPool, setTotalPool] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Obtener gameweek actual de la API de FPL
        const apiResponse = await fetch('/api/league');
        const fplData = await apiResponse.json();
        
        // Encontrar el próximo gameweek (primer partido no terminado)
        const upcomingMatches = fplData.matches.filter((m: any) => !m.finished);
        const nextGW = upcomingMatches.length > 0 ? upcomingMatches[0].event : 8;
        setCurrentGameweek(nextGW);

        // 2. Contar apuestas activas (status='pending')
        const { count: activeBetsCount } = await supabase
          .from('bets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        setActiveBets(activeBetsCount || 0);

        // 3. Sumar montos apostados en el gameweek actual
        const { data: gwBets } = await supabase
          .from('bets')
          .select('amount')
          .eq('gameweek', nextGW)
          .eq('status', 'pending');
        
        const gwTotal = gwBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;
        setGwAmount(gwTotal);

        // 4. Sumar todos los balances (pozo total)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('balance');
        
        const poolTotal = profiles?.reduce((sum, profile) => sum + profile.balance, 0) || 0;
        setTotalPool(poolTotal);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  return (
    <section className="relative overflow-hidden w-full" style={{ backgroundColor: 'rgb(55, 0, 60)' }}>
      
      <div className="relative w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-10 md:pt-12 lg:pt-16 pb-8 sm:pb-10 md:pb-12 lg:pb-16 rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl">
        <div className="text-center">
          {/* Gameweek Actual - Título */}
          <div 
            className="inline-block px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl md:rounded-3xl mb-6 sm:mb-8"
            style={{ background: 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))' }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-0" style={{ color: '#37003c' }}>
              {loading ? (
                <span className="animate-pulse">Gameweek ...</span>
              ) : (
                `Gameweek ${currentGameweek}`
              )}
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
            {/* Apuestas Activas */}
            <div className="bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ff2882] mb-1 sm:mb-2">
                {loading ? '...' : activeBets}
              </div>
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 uppercase tracking-wider">
                Apuestas Activas
              </div>
            </div>

            {/* Monto Apostado GW */}
            <div className="bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#00ff87] mb-1 sm:mb-2">
                {loading ? '...' : `$${gwAmount.toLocaleString()}`}
              </div>
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 uppercase tracking-wider">
                Apostado GW
              </div>
            </div>

            {/* Pozo Total */}
            <div className="bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2">
                {loading ? '...' : `$${totalPool.toLocaleString()}`}
              </div>
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 uppercase tracking-wider">
                Pozo Total
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



