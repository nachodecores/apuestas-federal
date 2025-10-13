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
        const upcomingMatches = fplData.matches.filter((m: { finished: boolean }) => !m.finished);
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
    <section className="relative overflow-hidden w-full bg-[#ebe5eb] py-8 sm:py-12 md:py-16 lg:py-20">
      
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: 'rgb(55, 0, 60)' }}>
        <div className="relative flex justify-center">
          {/* Gameweek Actual - Título con gradiente en la parte superior */}
          <div 
            className="w-[80%] px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl text-center"
            style={{ background: 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))' }}
          >
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-normal mb-0" style={{ color: '#37003c' }}>
              {loading ? (
                <span className="animate-pulse">Gameweek ...</span>
              ) : (
                `Gameweek ${currentGameweek}`
              )}
            </h2>
          </div>
        </div>

        {/* Contenido con stats */}
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="text-center">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
            {/* Apuestas Activas */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 tracking-wider mb-2 sm:mb-3">
                n° apuestas
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : activeBets}
              </div>
            </div>

            {/* Monto Apostado GW */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 tracking-wider mb-2 sm:mb-3">
                Total apostado
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : `$${gwAmount.toLocaleString()}`}
              </div>
            </div>

            {/* Pozo Total */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 tracking-wider mb-2 sm:mb-3">
                Pozo
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : `$${totalPool.toLocaleString()}`}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



