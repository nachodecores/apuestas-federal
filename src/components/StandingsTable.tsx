interface Player {
  position: number;
  name: string;
  points: number;
  balance: number;
}

interface StandingsTableProps {
  standings: Player[];
  gameweek: number;
}

export default function StandingsTable({ standings, gameweek }: StandingsTableProps) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl sm:text-4xl font-black text-white">
            Tabla de Posiciones
          </h3>
          <span className="text-sm text-gray-500 uppercase tracking-wider">
            Gameweek {gameweek}
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    CCP
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                    Puntos FPL
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, idx) => (
                  <tr
                    key={player.position}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-[#00ff87] text-black' : 'bg-white/10 text-white'
                      }`}>
                        {player.position}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">{player.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[#00ff87] font-bold">{player.points}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        player.balance > 1000 ? 'text-[#00ff87]' : 'text-[#ff2882]'
                      }`}>
                        ${player.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}



