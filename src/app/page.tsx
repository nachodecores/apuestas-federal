import {
  Header,
  Hero,
  HowItWorks,
  StandingsTable,
  UpcomingMatches,
  CTASection,
  Footer
} from "@/components";

export default function Home() {
  // Mock data - después lo reemplazaremos con datos reales de la API
  const standings = [
    { position: 1, name: "Juan", points: 1847, balance: 2500 },
    { position: 2, name: "Martín", points: 1823, balance: 1800 },
    { position: 3, name: "Pablo", points: 1801, balance: 2100 },
    { position: 4, name: "Lucas", points: 1789, balance: 900 },
    { position: 5, name: "Diego", points: 1776, balance: 1500 },
  ];

  const upcomingMatches = [
    { gameweek: 12, team1: "Juan", team2: "Martín", date: "Sáb 12/10" },
    { gameweek: 12, team1: "Pablo", team2: "Lucas", date: "Sáb 12/10" },
    { gameweek: 12, team1: "Diego", team2: "Juan", date: "Sáb 12/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <Hero />
      <HowItWorks />
      <StandingsTable standings={standings} gameweek={11} />
      <UpcomingMatches matches={upcomingMatches} gameweek={12} />
      <CTASection />
      <Footer />
    </div>
  );
}
