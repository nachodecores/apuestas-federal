export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-fpl-radial opacity-20"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
         
          

          
         
          
       

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



