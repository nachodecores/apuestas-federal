"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Header from "@/components/Header";

interface ResolveResult {
  success: boolean;
  gameweek: number;
  resolved: number;
  won: number;
  lost: number;
  users_updated: number;
  error?: string;
}

export default function AdminPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameweekToResolve, setGameweekToResolve] = useState<number>(8);
  const [resolving, setResolving] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    
    getUser();
  }, [supabase]);

  async function handleResolve() {
    if (!gameweekToResolve || gameweekToResolve < 1 || gameweekToResolve > 38) {
      alert('Por favor, ingresá un gameweek válido (1-38)');
      return;
    }

    const confirmResolve = confirm(
      `¿Estás seguro de que querés resolver las apuestas del Gameweek ${gameweekToResolve}?\n\nEsto actualizará los balances de los usuarios y no se puede deshacer.`
    );

    if (!confirmResolve) return;

    setResolving(true);
    setResult(null);

    try {
      const response = await fetch('/api/bets/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameweek: gameweekToResolve }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al resolver apuestas');
      }

      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        gameweek: gameweekToResolve,
        resolved: 0,
        won: 0,
        lost: 0,
        users_updated: 0,
        error: error.message,
      });
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso denegado</h1>
          <p className="text-gray-400 mb-6">Necesitás iniciar sesión para acceder al panel de admin</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl gradient-fpl font-bold hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Título */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-400">
            Resolvé las apuestas de cada gameweek cuando los partidos hayan finalizado
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Resolver Apuestas</h3>
          
          {/* Input de gameweek */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Gameweek a resolver
            </label>
            <input
              type="number"
              min="1"
              max="38"
              value={gameweekToResolve}
              onChange={(e) => setGameweekToResolve(parseInt(e.target.value) || 1)}
              disabled={resolving}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-[#ff2882] transition-colors disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ingresá el número del gameweek que ya finalizó y querés resolver
            </p>
          </div>

          {/* Botón de resolver */}
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full py-4 rounded-xl gradient-fpl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resolving ? 'Resolviendo...' : `Resolver Gameweek ${gameweekToResolve}`}
          </button>

          {/* Advertencia */}
          <div className="mt-4 p-4 rounded-xl bg-[#ff2882]/10 border border-[#ff2882]/20">
            <p className="text-sm text-[#ff2882]">
              ⚠️ <strong>Advertencia:</strong> Esta acción actualizará los balances de los usuarios y no se puede deshacer. Asegurate de que el gameweek haya finalizado completamente.
            </p>
          </div>
        </div>

        {/* Resultado de la resolución */}
        {result && (
          <div className={`bg-white/5 border rounded-2xl p-8 ${
            result.success 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-red-500/50 bg-red-500/5'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 ${
              result.success ? 'text-green-500' : 'text-red-500'
            }`}>
              {result.success ? '✓ Resolución completada' : '✗ Error en la resolución'}
            </h3>
            
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Apuestas resueltas</div>
                    <div className="text-3xl font-black text-white">{result.resolved}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Usuarios actualizados</div>
                    <div className="text-3xl font-black text-white">{result.users_updated}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Apuestas ganadas</div>
                    <div className="text-3xl font-black text-green-500">{result.won}</div>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Apuestas perdidas</div>
                    <div className="text-3xl font-black text-red-500">{result.lost}</div>
                  </div>
                </div>
                
                <p className="text-gray-400 text-center mt-4">
                  El Gameweek {result.gameweek} ha sido resuelto exitosamente
                </p>
              </div>
            ) : (
              <div>
                <p className="text-red-400 mb-4">
                  {result.error || 'Error desconocido al resolver apuestas'}
                </p>
                <p className="text-gray-400 text-sm">
                  Verificá que el gameweek esté correcto y que los partidos hayan finalizado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info adicional */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-white mb-3">¿Cómo funciona?</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>• El sistema consulta la API de FPL para obtener los resultados reales</li>
            <li>• Compara cada predicción de los usuarios con el resultado real</li>
            <li>• Actualiza el estado de las apuestas (ganadas o perdidas)</li>
            <li>• Suma las ganancias al balance de los usuarios que acertaron</li>
            <li>• Registra todas las transacciones en el historial</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

