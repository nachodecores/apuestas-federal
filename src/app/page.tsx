import {
  Header,
  Hero,
  StandingsTable,
  UpcomingMatches,
  Footer
} from "@/components";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <Hero />
      
      {/* Layout responsive: 3 breakpoints */}
      <div className="bg-[#ebe5eb]">
        {/* Mobile (0-479px): componentes apilados */}
        <div className="block min-[480px]:hidden">
          <StandingsTable />
          <UpcomingMatches />
        </div>
        
        {/* Tablet (480-767px) y Desktop (768px+): componentes lado a lado */}
        <div className="hidden min-[480px]:flex min-[480px]:min-h-screen">
          {/* Tabla de posiciones - mitad izquierda */}
          <div className="flex-1 min-[480px]:w-1/2">
            <StandingsTable />
          </div>
          
          {/* Próximos partidos - mitad derecha */}
          <div className="flex-1 min-[480px]:w-1/2">
            <UpcomingMatches />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
