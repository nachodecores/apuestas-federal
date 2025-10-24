"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { MatchCardProps, BetSelection, UserBet, MatchDisplay } from "@/types";
import DeleteBetButton from "./DeleteBetButton";

export default function MatchCard({ 
  match, 
  matchIndex, 
  user, 
  userBalance, 
  onBetConfirmed 
}: MatchCardProps) {
  // Estado para la apuesta de este partido específico
  const [bet, setBet] = useState<BetSelection>({
    prediction: null,
    amount: ''
  });

  // Estado para la apuesta existente del usuario
  const [userBet, setUserBet] = useState<UserBet | null>(null);

  // Limpiar el estado cuando cambia el usuario
  useEffect(() => {
    setUserBet(null);
    setBet({
      prediction: null,
      amount: ''
    });
  }, [user?.id]); // Se ejecuta cuando cambia el ID del usuario

  // Verificar si el usuario ya apostó en este partido
  useEffect(() => {
    if (user && match) {
      checkExistingBet();
    } else {
      // Si no hay usuario, limpiar el estado
      setUserBet(null);
      setBet({
        prediction: null,
        amount: ''
      });
    }
  }, [user, match]);

  // Escuchar eventos de apuesta eliminada
  useEffect(() => {
    function handleBetDeleted(event: CustomEvent) {
      const { gameweek, match_league_entry_1, match_league_entry_2 } = event.detail;
      
      // Si es el mismo partido, verificar nuevamente las apuestas
      // Convertir a números para comparación segura
      if (Number(gameweek) === Number(match.gameweek) && 
          Number(match_league_entry_1) === Number(match.league_entry_1) && 
          Number(match_league_entry_2) === Number(match.league_entry_2)) {
        checkExistingBet();
      } else {
      }
    }
    
    window.addEventListener('betDeleted', handleBetDeleted as EventListener);
    return () => window.removeEventListener('betDeleted', handleBetDeleted as EventListener);
  }, [match]);

  async function checkExistingBet() {
    try {
      const response = await fetch(`/api/bets/user-bet?gameweek=${match.gameweek}&match_league_entry_1=${match.league_entry_1}&match_league_entry_2=${match.league_entry_2}`);
      const data = await response.json();
      
      if (data.bet) {
        setUserBet(data.bet);
      } else {
        setUserBet(null);
      }
    } catch (error) {
      console.error('Error checking existing bet:', error);
    }
  }

  // Función para actualizar la predicción (toggle: clicar de nuevo des-selecciona)
  function handlePredictionChange(prediction: 'home' | 'draw' | 'away') {
    setBet(prev => ({
      ...prev,
      prediction: prev.prediction === prediction ? null : prediction,
      amount: prev.amount || ''
    }));
  }

  // Función para incrementar el monto ($10)
  function handleIncrementAmount() {
    setBet(prev => {
      const currentAmount = parseFloat(prev.amount || '0');
      const newAmount = currentAmount + 10;
      
      return {
        ...prev,
        amount: newAmount.toString()
      };
    });
  }

  // Función para decrementar el monto ($10)
  function handleDecrementAmount() {
    setBet(prev => {
      const currentAmount = parseFloat(prev.amount || '0');
      const newAmount = Math.max(0, currentAmount - 10); // No permitir negativos
      
      return {
        ...prev,
        amount: newAmount > 0 ? newAmount.toString() : ''
      };
    });
  }

  // Función para confirmar la apuesta
  async function handleConfirmBet() {
    // Validaciones
    if (!user) {
      return;
    }
    
    if (!bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0) {
      return;
    }
    
    const betAmount = parseFloat(bet.amount);
    
    if (betAmount > userBalance) {
      return;
    }
    
    // Preparar datos para enviar al backend
    const betData = {
      gameweek: match.gameweek,
      match_league_entry_1: match.league_entry_1,
      match_league_entry_2: match.league_entry_2,
      prediction: bet.prediction,
      amount: betAmount,
      odds: match.odds[bet.prediction],
      potential_win: betAmount * match.odds[bet.prediction]
    };
    
    try {
      // Llamar al endpoint para crear la apuesta
      const response = await fetch('/api/bets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bets: [betData] }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear apuesta');
      }
      
      // Éxito! Actualizar el balance local
      onBetConfirmed(result.new_balance);
      
      // Actualizar el estado local con la apuesta confirmada
      setUserBet({
        id: result.bet_id,
        prediction: bet.prediction,
        amount: betAmount,
        potential_win: betAmount * match.odds[bet.prediction]
      });
      
      // Apuesta confirmada exitosamente
      
      // Limpiar la apuesta
      setBet({
        prediction: null,
        amount: ''
      });
      
    } catch (error) {
      console.error('Error al confirmar apuesta:', error);
    }
  }

  return (
    <div
      className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10"
      style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
    >
      {/* Equipos */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 gap-1 sm:gap-2">
        {/* Local - Solo datos */}
        <div className="flex flex-col min-w-0 overflow-hidden flex-1">
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team1Name}
          </div>
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team1Manager}
          </div>
        </div>
        
        <div className="text-gray-800 font-black text-xs sm:text-sm md:text-base px-0.5 sm:px-1 md:px-2 flex-shrink-0">
          VS
        </div>
        
        {/* Visitante - Solo datos */}
        <div className="flex flex-col text-right min-w-0 overflow-hidden flex-1">
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team2Name}
          </div>
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team2Manager}
          </div>
        </div>
      </div>

      {/* Botones de apuesta - SOLO SI HAY USUARIO LOGUEADO */}
      {user && (
        <>
          {userBet ? (
            // Mostrar apuesta existente
            <div className="mb-3 sm:mb-4 p-3 rounded-lg relative" style={{ background: 'linear-gradient(to right, #02efff, #00ff87)' }}>
              <div className="text-center">
                <div className="text-[0.625rem] tablet:text-xs font-medium text-[#37003c]">
                  {userBet.prediction === 'home' && `Apostaste ₣${userBet.amount} a que gana ${match.team1Name}`}
                  {userBet.prediction === 'away' && `Apostaste ₣${userBet.amount} a que gana ${match.team2Name}`}
                  {userBet.prediction === 'draw' && `Apostaste ₣${userBet.amount} a un empate`}
                </div>
              </div>
              
              {/* Delete button in top-right */}
              {userBet.id && (
                <div className="absolute top-2 right-2">
                  <DeleteBetButton 
                    betId={userBet.id.toString()}
                    userId={user?.id}
                    variant="icon"
                    size="sm"
                    className="!bg-transparent !text-white !border-0 !shadow-none hover:!opacity-80 !transition-opacity"
                    onDeleteSuccess={(betId, refundAmount) => {
                      setUserBet(null);
                      onBetConfirmed(userBalance + refundAmount); // Update balance
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            // Mostrar botones de apuesta
            <>
              {/* Radio buttons para predicción */}
              <div className="mb-3 sm:mb-4">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Local */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange('home')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bet.prediction === 'home'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bet.prediction === 'home' 
                      ? { background: 'linear-gradient(to right, #02efff, #00ff87)' }
                      : { backgroundColor: '#efefef' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bet.prediction === 'home' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Local
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bet.prediction === 'home' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.home.toFixed(2)}
                    </div>
                  </button>
                  
                  {/* Empate */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange('draw')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bet.prediction === 'draw'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bet.prediction === 'draw' 
                      ? { background: 'linear-gradient(to right, #02efff, #00ff87)' }
                      : { backgroundColor: '#efefef' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bet.prediction === 'draw' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Empate
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bet.prediction === 'draw' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.draw.toFixed(2)}
                    </div>
                  </button>
                  
                  {/* Visitante */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange('away')}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      bet.prediction === 'away'
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={bet.prediction === 'away' 
                      ? { background: 'linear-gradient(to right, #02efff, #00ff87)' }
                      : { backgroundColor: '#efefef' }
                    }
                  >
                    <div className={`font-semibold text-xs sm:text-sm ${
                      bet.prediction === 'away' ? 'text-[#37003c]' : 'text-gray-700'
                    }`}>
                      Visitante
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs mt-0.5 sm:mt-1 ${
                      bet.prediction === 'away' ? 'text-[#37003c]' : 'text-gray-800'
                    }`}>
                      {match.odds.away.toFixed(2)}
                    </div>
                  </button>
                </div>
              </div>

              {/* Input de monto con botones + y - */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Botón - (30%) */}
                  <button
                    type="button"
                    onClick={handleDecrementAmount}
                    className="w-[30%] py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg text-gray-700 font-bold text-xl sm:text-2xl md:text-3xl hover:opacity-80 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: '#efefef' }}
                    onMouseDown={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #02efff, #00ff87)'}
                    onMouseUp={(e) => e.currentTarget.style.background = '#efefef'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#efefef'}
                    onTouchStart={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #02efff, #00ff87)'}
                    onTouchEnd={(e) => e.currentTarget.style.background = '#efefef'}
                  >
                    −
                  </button>
                  
                  {/* Contador central (40%) */}
                  <div 
                    className={`w-[40%] text-center py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${
                      parseFloat(bet.amount || '0') > 0 ? '' : 'bg-white'
                    }`}
                    style={parseFloat(bet.amount || '0') > 0 
                      ? { background: 'linear-gradient(to right, #02efff, #00ff87)' }
                      : {}
                    }
                  >
                    <div className={`text-sm sm:text-base font-bold ${
                      parseFloat(bet.amount || '0') > 0 ? 'text-[#37003c]' : 'text-gray-900'
                    }`}>
                      ₣{parseFloat(bet.amount || '0').toFixed(0)}
                    </div>
                  </div>
                  
                  {/* Botón + (30%) */}
                  <button
                    type="button"
                    onClick={handleIncrementAmount}
                    className="w-[30%] py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg text-gray-700 font-bold text-xl sm:text-2xl md:text-3xl hover:opacity-80 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: '#efefef' }}
                    onMouseDown={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #02efff, #00ff87)'}
                    onMouseUp={(e) => e.currentTarget.style.background = '#efefef'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#efefef'}
                    onTouchStart={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #02efff, #00ff87)'}
                    onTouchEnd={(e) => e.currentTarget.style.background = '#efefef'}
                  >
                    +
                  </button>
                </div>
                
                {/* Botón confirmar apuesta individual */}
                <button
                  onClick={handleConfirmBet}
                  disabled={!bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0}
                  className={`w-full mt-3 sm:mt-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg ${
                    !bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0
                      ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                      : 'hover:opacity-90 shadow-[#963cff]/20'
                  }`}
                  style={!bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0 
                    ? {} 
                    : { backgroundColor: '#963cff', color: 'white' }
                  }
                >
                  Confirmar Apuesta
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
