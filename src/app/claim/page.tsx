"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  display_name: string;
  is_claimed: boolean;
  league_entry_id: number;
}

export default function ClaimPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de perfiles
  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, is_claimed, league_entry_id")
          .order("display_name");

        if (error) throw error;
        setProfiles(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, [supabase]);

  // Reclamar cuenta
  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedProfile) return;
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      // 1. Crear usuario en auth.users con email temporal
      const email = `${selectedProfile.league_entry_id}@apuestasfederal.local`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: selectedProfile.display_name,
            league_entry_id: selectedProfile.league_entry_id,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Error al crear usuario");

      // 2. Actualizar el profile existente con el auth id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          id: authData.user.id,
          email: email,
          is_claimed: true,
        })
        .eq("league_entry_id", selectedProfile.league_entry_id);

      if (updateError) throw updateError;

      // 3. Crear transacción de balance inicial
      await supabase.from("transactions").insert({
        user_id: authData.user.id,
        amount: 1000.00,
        type: "initial_balance",
        balance_after: 1000.00,
      });

      // Éxito! Redirigir al dashboard
      alert(`¡Cuenta reclamada exitosamente, ${selectedProfile.display_name}!`);
      router.push("/dashboard");
      router.refresh();
      
    } catch (error: any) {
      setError(error.message || "Error al reclamar la cuenta");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando participantes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-fpl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-black text-2xl">BF</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Reclamá tu cuenta
          </h1>
          <p className="text-gray-400">
            Seleccioná tu nombre de la lista y creá tu contraseña
          </p>
        </div>

        {!selectedProfile ? (
          // Lista de participantes
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Participantes de la liga
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => !profile.is_claimed && setSelectedProfile(profile)}
                  disabled={profile.is_claimed}
                  className={`p-6 rounded-xl text-left transition-all ${
                    profile.is_claimed
                      ? "bg-white/5 border border-white/5 cursor-not-allowed opacity-50"
                      : "bg-white/5 border border-white/10 hover:border-[#ff2882] hover:scale-105 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-lg mb-1">
                        {profile.display_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {profile.is_claimed ? "Ya reclamado" : "Disponible"}
                      </div>
                    </div>
                    {profile.is_claimed ? (
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-500">✕</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00ff87]/20 flex items-center justify-center">
                        <span className="text-[#00ff87]">→</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          // Formulario de contraseña
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <button
              onClick={() => setSelectedProfile(null)}
              className="text-gray-400 hover:text-white transition-colors mb-6"
            >
              ← Volver a la lista
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                {selectedProfile.display_name.split(" ").map(n => n[0]).join("")}
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {selectedProfile.display_name}
              </h2>
              <p className="text-gray-400">
                Creá tu contraseña para acceder
              </p>
            </div>

            <form onSubmit={handleClaim} className="space-y-4">
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
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                  placeholder="Repetí tu contraseña"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={claiming}
                className="w-full py-4 rounded-xl gradient-fpl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {claiming ? "Reclamando cuenta..." : "Reclamar mi cuenta"}
              </button>
            </form>
          </div>
        )}

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

