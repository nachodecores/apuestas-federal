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
  onBetConfirmed,
  userBet: propUserBet,
  deadlinePassed = false
}: MatchCardProps) {
  // Estado para la apuesta de este partido específico
  const [bet, setBet] = useState<BetSelection>({
    prediction: null,
    amount: ''
  });

  // Usar la prop userBet directamente (optimización)
  const userBet = propUserBet;

  // Limpiar el estado cuando cambia el usuario
  useEffect(() => {
    setBet({
      prediction: null,
      amount: ''
    });
  }, [user?.id]); // Se ejecuta cuando cambia el ID del usuario

  // Escuchar eventos de apuesta eliminada
  useEffect(() => {
    function handleBetDeleted(event: CustomEvent) {
      const { gameweek, match_league_entry_1, match_league_entry_2 } = event.detail;
      
      // Si es el mismo partido, limpiar el estado local
      // Convertir a números para comparación segura
      if (Number(gameweek) === Number(match.gameweek) && 
          Number(match_league_entry_1) === Number(match.league_entry_1) && 
          Number(match_league_entry_2) === Number(match.league_entry_2)) {
        setBet({
          prediction: null,
          amount: ''
        });
      }
    }
    
    window.addEventListener('betDeleted', handleBetDeleted as EventListener);
    return () => window.removeEventListener('betDeleted', handleBetDeleted as EventListener);
  }, [match]);

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
      alert('Insufficient balance');
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
      
      // Disparar evento global para que Hero.tsx actualice stats
      const betCreatedEvent = new CustomEvent('betCreated', {
        detail: {
          gameweek: betData.gameweek,
          match_league_entry_1: betData.match_league_entry_1,
          match_league_entry_2: betData.match_league_entry_2,
          amount: betAmount
        }
      });
      window.dispatchEvent(betCreatedEvent);
      
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
      className="w-full block p-4 sm:p-5 md:p-6 border border-white/10"
      style={{ backgroundColor: 'rgba(237, 237, 237, 0.85)' }}
    >
      {/* Equipos */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* Local - Solo datos */}
        <div className="flex flex-col min-w-0 overflow-hidden flex-1">
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team1Name}
          </div>
          <div className="text-gray-900 font-semibold text-[0.625rem] sm:text-xs md:text-sm truncate">
            {match.team1Manager}
          </div>
        </div>
        
        <div className="text-gray-700 font-medium text-xs sm:text-sm md:text-base px-0.5 sm:px-1 md:px-2 flex-shrink-0">
          v
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
            <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 p-3 rounded-lg relative" style={{ background: 'linear-gradient(to right, #02efff, #00ff87)' }}>
              <div className="text-center">
                <div className="text-[0.625rem] tablet:text-xs font-medium text-[#37003c]">
                  {userBet.prediction === 'home' && `You bet F$${userBet.amount} on ${match.team1Name} to win`}
                  {userBet.prediction === 'away' && `You bet F$${userBet.amount} on ${match.team2Name} to win`}
                  {userBet.prediction === 'draw' && `You bet F$${userBet.amount} on a draw`}
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
              <div className="mt-3 sm:mt-4 mb-3 sm:mb-4">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Local */}
                  <button
                    type="button"
                    onClick={() => handlePredictionChange('home')}
                    disabled={deadlinePassed}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      deadlinePassed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : bet.prediction === 'home'
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
                      Home
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
                    disabled={deadlinePassed}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      deadlinePassed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : bet.prediction === 'draw'
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
                      Draw
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
                    disabled={deadlinePassed}
                    className={`py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all ${
                      deadlinePassed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : bet.prediction === 'away'
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
                      Away
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
                    disabled={deadlinePassed}
                    className={`w-[30%] py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg text-gray-700 font-bold text-xl sm:text-2xl md:text-3xl transition-opacity flex items-center justify-center ${
                      deadlinePassed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:opacity-80'
                    }`}
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
                      F${parseFloat(bet.amount || '0').toFixed(0)}
                    </div>
                  </div>
                  
                  {/* Botón + (30%) */}
                  <button
                    type="button"
                    onClick={handleIncrementAmount}
                    disabled={deadlinePassed}
                    className={`w-[30%] py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg text-gray-700 font-bold text-xl sm:text-2xl md:text-3xl transition-opacity flex items-center justify-center ${
                      deadlinePassed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:opacity-80'
                    }`}
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
                  disabled={deadlinePassed || !bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0}
                  className={`w-full mt-3 sm:mt-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg ${
                    deadlinePassed || !bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0
                      ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                      : 'hover:opacity-90 shadow-[#963cff]/20'
                  }`}
                  style={deadlinePassed || !bet.prediction || !bet.amount || parseFloat(bet.amount) <= 0 
                    ? {} 
                    : { backgroundColor: '#963cff', color: 'white' }
                  }
                >
                  Confirm Bet
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
