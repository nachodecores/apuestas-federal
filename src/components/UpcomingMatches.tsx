interface Match {
  gameweek: number;
  team1: string;
  team2: string;
  date: string;
}

interface UpcomingMatchesProps {
  matches: Match[];
  gameweek: number;
}

export default function UpcomingMatches({ matches, gameweek }: UpcomingMatchesProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-[#37003c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl sm:text-4xl font-black text-white mb-12">
          Próximos Partidos - GW{gameweek}
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff2882]/50 transition-all hover:scale-105"
            >
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                {match.date}
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] mx-auto mb-2"></div>
                  <div className="text-white font-semibold">{match.team1}</div>
                </div>
                
                <div className="text-gray-600 font-black text-xl px-4">VS</div>
                
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#37003c] to-[#00ff87] mx-auto mb-2"></div>
                  <div className="text-white font-semibold">{match.team2}</div>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-[#ff2882] text-white font-bold hover:bg-[#ff2882]/90 transition-colors">
                Apostar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



