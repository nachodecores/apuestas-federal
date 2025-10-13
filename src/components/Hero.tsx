export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#ebe5eb]">
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
         
          

          
         
          
       

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-8">
            <div>
              <div className="text-4xl font-black text-[#ff2882] mb-2">10</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">Jugadores</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#00ff87] mb-2">$10k</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">Balance Inicial</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#37003c] mb-2">38</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">Gameweeks</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



