"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista de emails permitidos (los 10 de la liga)
  // TODO: Esto idealmente vendría de la base de datos o variables de entorno
  const allowedEmails: string[] = [
    // Por ahora dejamos esto vacío para permitir cualquier email
    // Más adelante configuramos la lista real
  ];

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar email si tenemos lista de permitidos
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        throw new Error("Este email no está autorizado para registrarse. Solo miembros de la liga.");
      }

      // Registrar usuario en Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Si el registro es exitoso
      alert("¡Registro exitoso! Revisá tu email para confirmar tu cuenta.");
      router.push("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrarse";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth
  async function handleGoogleRegister() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrarse con Google";
      setError(errorMessage);
      setLoading(false);
    }
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
            Unite al Boliche
          </h1>
          <p className="text-gray-400">
            Creá tu cuenta y empezá a apostar con tus amigos
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Botón de Google */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-500">O con email</span>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-white mb-2">
                Nombre para mostrar
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2882] transition-colors"
                placeholder="tu@email.com"
              />
            </div>

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

            {/* Mensaje de error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-fpl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          {/* Link a login */}
          <p className="text-center text-gray-400 text-sm mt-6">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-[#ff2882] font-semibold hover:underline">
              Iniciá sesión
            </Link>
          </p>
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

