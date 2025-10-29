"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [currentGameweek, setCurrentGameweek] = useState<number>(8);
  const [activeBets, setActiveBets] = useState<number>(0);
  const [gwAmount, setGwAmount] = useState<number>(0);
  const [totalPool, setTotalPool] = useState<number>(0);
  const [federalPool, setFederalPool] = useState<number>(0);
  const [realPool, setRealPool] = useState<number>(10000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setCurrentGameweek(data.currentGameweek);
        setActiveBets(data.activeBets);
        setGwAmount(data.gwAmount);
        setTotalPool(data.totalPool);
        setFederalPool(data.federalPool || 0);
        setRealPool(data.realPool || 10000);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <section className="relative overflow-hidden w-full bg-[#ebe5eb] py-8 sm:py-12 md:py-16 lg:py-20">
      
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: '#37003c' }}>
        {/* Pattern overlay - alineado a la izquierda */}
        <div 
          className="absolute left-0 bottom-0 h-1/2 w-1/3 overflow-hidden"
          style={{
            backgroundImage: 'url(/assets/pattern-1.png)',
            backgroundPosition: 'left bottom',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundAttachment: 'local',
            marginLeft: '-30px'
          }}
        >
          <div 
            className="w-full h-[200%]"
            style={{
              backgroundImage: 'url(/assets/pattern-1.png)',
              backgroundPosition: 'left bottom',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              marginLeft: '-30px'
            }}
          />
        </div>
        <div className="relative flex justify-center">
          {/* Gameweek Actual - Título con gradiente en la parte superior */}
          <div 
            className="w-[80%] px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl text-center"
            style={{ background: 'linear-gradient(to right, #00ff87, #02efff)' }}
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 max-w-2xl mx-auto">
            {/* Apuestas Activas */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 tracking-normal mb-2 sm:mb-3">
                n° apuestas
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, #00ff87, #02efff)',
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
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-300 tracking-normal mb-2 sm:mb-3">
                Total apostado
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, #00ff87, #02efff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : `F$${gwAmount.toLocaleString()}`}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pozo Stats - Fuera del div violeta */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {/* Pozo Real */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-600 tracking-normal mb-2 sm:mb-3">
                Pozo Real
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, #ff2882, rgb(55, 0, 60))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                ${realPool.toLocaleString()}
              </div>
            </div>

            {/* Pozo Federal */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-600 tracking-normal mb-2 sm:mb-3">
                Pozo Federal
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to left, #ff2882, rgb(55, 0, 60))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : `F$${federalPool.toLocaleString()}`}
              </div>
            </div>

            {/* TC (Tipo de Cambio) */}
            <div className="text-center">
              <div className="text-[0.625rem] sm:text-xs md:text-sm text-gray-600 tracking-normal mb-2 sm:mb-3">
                TC
              </div>
              <div 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0"
                style={{ 
                  background: 'linear-gradient(to right, #ff2882, rgb(55, 0, 60))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {loading ? '...' : (federalPool / realPool).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



