import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import RotatingHero from "@/components/home/RotatingHero";
import FeatureBento from "@/components/home/FeatureBento";
import AudienceMiniRow from "@/components/home/AudienceMiniRow";
import FinalCTA from "@/components/home/FinalCTA";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  usePageMeta({
    title: "Locus — Everything a Law Student in India Actually Needs",
    description:
      "Directory of 3,890+ firms, daily skill challenges, templates, tools, and a tracker. The merit-first platform for India's law students.",
    path: "/",
  });

  const navigate = useNavigate();
  const { ready, userId } = useAuthSession();

  useEffect(() => {
    if (ready && userId) navigate("/app", { replace: true });
  }, [ready, userId, navigate]);

  // Don't block paint waiting for auth — render the marketing page immediately.
  // If a session is already cached, the redirect above fires synchronously on mount.
  if (ready && userId) {
    return <div className="min-h-screen" />;
  }

  return (
    <>
      <RotatingHero />
      <FeatureBento />
      <AudienceMiniRow />
      <FinalCTA />
    </>
  );
};

export default Index;
