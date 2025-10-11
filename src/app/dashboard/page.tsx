import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtenemos el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect("/login");
  }

  // Obtener el perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header simple */}
      <header className="border-b border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          
          <form action="/auth/signout" method="post">
            <button 
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-black text-white mb-2">
            ¡Bienvenido, {profile?.display_name || user.email}!
          </h2>
          <p className="text-gray-400">
            Tu cuenta está lista para empezar a apostar
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Balance */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Tu balance</div>
            <div className="text-4xl font-black text-[#00ff87]">
              ${profile?.balance?.toLocaleString() || "0"}
            </div>
          </div>

          {/* Apuestas activas */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Apuestas activas</div>
            <div className="text-4xl font-black text-white">0</div>
          </div>

          {/* Victorias */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Victorias</div>
            <div className="text-4xl font-black text-[#ff2882]">0</div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-br from-[#ff2882]/10 to-[#37003c]/10 border border-[#ff2882]/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            🎉 ¡Todo listo!
          </h3>
          <p className="text-gray-300 mb-4">
            Tu cuenta ha sido creada exitosamente. Ya podés:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Ver los próximos partidos de la liga</li>
            <li>✅ Hacer apuestas con tu balance de ${profile?.balance}</li>
            <li>✅ Competir con tus amigos por más fichas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

