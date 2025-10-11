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
      <StandingsTable />
      <UpcomingMatches />
      <Footer />
    </div>
  );
}
