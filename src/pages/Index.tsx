import ManifestoHero from "@/components/home/ManifestoHero";
import StatsBar from "@/components/StatsBar";
import FeatureBento from "@/components/home/FeatureBento";
import LocusPlusStrip from "@/components/home/LocusPlusStrip";
import AudienceMiniRow from "@/components/home/AudienceMiniRow";
import FinalCTA from "@/components/home/FinalCTA";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  usePageMeta({
    title: "Locus — Everything a Law Student in India Actually Needs",
    description: "Directory of 3,890+ firms, daily skill challenges, templates, tools, and a tracker. The merit-first platform for India's law students.",
    path: "/",
  });

  return (
    <>
      <ManifestoHero />
      <StatsBar />
      <FeatureBento />
      <LocusPlusStrip />
      <AudienceMiniRow />
      <FinalCTA />
    </>
  );
};

export default Index;
