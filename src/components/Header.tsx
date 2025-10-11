"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

// Lista de los 10 participantes (nombres reales de la API)
const PARTICIPANTS = [
  { name: 'Chacho Bonino', league_entry_id: 6753 },
  { name: 'Marcos Arocena', league_entry_id: 5156 },
  { name: 'Ignacio de Cores', league_entry_id: 38904 },
  { name: 'Manuel Domenech', league_entry_id: 44346 },
  { name: 'Juan Dehl', league_entry_id: 54556 },
  { name: 'Juan Francisco Sienra', league_entry_id: 5769 },
  { name: 'Felipe Migues', league_entry_id: 5997 },
  { name: 'Joaquin Sarachaga', league_entry_id: 6494 },
  { name: 'Javier Villaamil', league_entry_id: 6479 },
  { name: 'Ángel Cal', league_entry_id: 5865 },
];

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Obtener usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Login automático al seleccionar usuario
  async function handleSelectUser(participant: typeof PARTICIPANTS[0]) {
    setLoggingIn(true);
    
    try {
      const email = `${participant.league_entry_id}@bolichefederal.com`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: '1234',
      });

      if (error) throw error;

      // Cerrar el dropdown
      setShowDropdown(false);
      // NO redirigimos al dashboard, el usuario se queda en la página actual
      // El Header se actualiza automáticamente mostrando el botón "Dashboard"
    } catch (error: any) {
      alert(`Error: ${error.message}\n\nEste usuario aún no está creado en el sistema.`);
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <nav className="border-b border-white/10 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-fpl flex items-center justify-center font-bold text-white">
              BF
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#ff2882] to-[#00ff87] bg-clip-text text-transparent">
              El Boliche Federal
            </h1>
          </Link>

          {loading ? (
            <div className="w-24 h-10 bg-white/5 rounded-full animate-pulse"></div>
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 rounded-full gradient-fpl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loggingIn}
                className="px-6 py-2 rounded-full gradient-fpl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loggingIn ? "Ingresando..." : "¿Quién sos?"}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Seleccioná tu nombre
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {PARTICIPANTS.map((participant) => (
                      <button
                        key={participant.league_entry_id}
                        onClick={() => handleSelectUser(participant)}
                        disabled={loggingIn}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{participant.name}</div>
                        </div>
                        <div className="text-[#00ff87] opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}



