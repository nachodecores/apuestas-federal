"use client";

export default function Header() {
  return (
    <nav className="border-b border-white/10 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-fpl flex items-center justify-center font-bold text-white">
              BF
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#ff2882] to-[#00ff87] bg-clip-text text-transparent">
              El Boliche Federal
            </h1>
          </div>
          <button className="px-6 py-2 rounded-full gradient-fpl text-white font-semibold hover:opacity-90 transition-opacity">
            Ingresar
          </button>
        </div>
      </div>
    </nav>
  );
}



