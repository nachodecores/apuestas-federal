export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-fpl-radial opacity-20"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-[#ff2882]/30 bg-[#ff2882]/10">
            <span className="text-[#ff2882] font-semibold text-sm">
              ⚽ Gameweek 12 en curso
            </span>
          </div>
          
          <h2 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-[#ff2882] to-[#00ff87] bg-clip-text text-transparent">
              Apostá con
            </span>
            <br />
            <span className="text-white">tus amigos</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            La liga privada más competitiva de Fantasy Premier League.
            Apostá dólares ficticios y demostrá quién es el verdadero campeón.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-4 rounded-full gradient-fpl text-white font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-[#ff2882]/20">
              Crear Apuesta
            </button>
            <button className="px-8 py-4 rounded-full border-2 border-white/20 text-white font-bold text-lg hover:bg-white/5 transition-colors">
              Ver Reglas
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div>
              <div className="text-4xl font-black text-[#ff2882] mb-2">5</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Jugadores</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#00ff87] mb-2">$50k</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">En apuestas</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">12</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Gameweeks</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



