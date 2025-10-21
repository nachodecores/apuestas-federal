"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  display_name: string;
  email: string;
  is_claimed: boolean;
  league_entry_id: number;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de perfiles reclamados
  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, email, is_claimed, league_entry_id")
          .eq("is_claimed", true)
          .order("display_name");

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar perfiles';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedProfile) return;
    
    setLoggingIn(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: selectedProfile.email,
        password,
      });

      if (error) throw error;

      // Si el login es exitoso, redirigir a la página principal
      router.push("/");
      router.refresh();
    } catch {
      setError("Contraseña incorrecta");
    } finally {
      setLoggingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-fpl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-black text-2xl">BF</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-gray-400">
            Ingresá a tu cuenta para seguir apostando
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {!selectedProfile ? (
            // Lista de participantes
            <>
              <h2 className="text-xl font-bold text-white mb-6">
                Seleccioná tu cuenta
              </h2>
              
              <div className="space-y-3 mb-6">
                {profiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      No hay cuentas disponibles
                    </p>
                  </div>
                ) : (
                  profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff2882] transition-all hover:scale-102 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold">
                          {profile.display_name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="text-white font-semibold">
                          {profile.display_name}
                        </div>
                      </div>
                      <div className="text-[#00ff87]">→</div>
                    </button>
                  ))
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}
            </>
          ) : (
            // Formulario de contraseña
            <>
              <button
                onClick={() => {
                  setSelectedProfile(null);
                  setPassword("");
                  setError(null);
                }}
                className="text-gray-400 hover:text-white transition-colors mb-6"
              >
                ← Cambiar usuario
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedProfile.display_name.split(" ").map(n => n[0]).join("")}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {selectedProfile.display_name}
                </h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                    placeholder="Tu contraseña"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-3 rounded-xl gradient-fpl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loggingIn ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
              </form>
            </>
          )}

        </div>

        {/* Link a home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

