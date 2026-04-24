import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        navigate("/app", { replace: true });
      } else {
        setChecked(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!checked) {
    // Avoid a marketing-page flash for authenticated users while the session check runs.
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
