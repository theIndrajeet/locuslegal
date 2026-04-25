/**
 * RotatingHero — homepage hero with the migrated Waitlist pitch
 * (RainbowButton eyebrow + GooeyText morph headline + 3 audience CTAs)
 * over the new floating ShapeLandingBg background.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Target, FileText, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import ShapeLandingBg from "@/components/ui/shape-landing-bg";

// Defer GooeyText (animation + SVG filter) so the static headline paints first.
// This unblocks FCP/LCP — Lighthouse was waiting on the opacity-0 span inside it.
const GooeyText = lazy(() =>
  import("@/components/ui/gooey-text-morphing").then((m) => ({ default: m.GooeyText }))
);

const FEATURES = [
  { icon: Building2, label: "3,890+ Firms Directory" },
  { icon: Target, label: "Daily Skill Challenges" },
  { icon: FileText, label: "Templates & Tools" },
  { icon: LineChart, label: "Application Tracker" },
];

export default function RotatingHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section
      aria-label="Locus introduction"
      className="relative min-h-[88vh] flex items-center overflow-hidden"
    >
      <ShapeLandingBg />

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <RainbowButton
            className={`mb-8 font-heading text-sm font-semibold tracking-widest uppercase transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your merit. Your internship.
          </RainbowButton>

          <h1
            className={`font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8 text-foreground transition-all duration-700 delay-150 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Get the internship you deserve —{" "}
            <GooeyText
              texts={[
                "not the one your college got you.",
                "based on your skills, not your campus.",
                "earned through merit, not connections.",
              ]}
              morphTime={2}
              cooldownTime={1.5}
              className="block mt-2 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[200px]"
              textClassName="text-accent font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            />
          </h1>

          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 border-2 border-border bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 text-left"
              >
                <Icon className="h-5 w-5 text-accent shrink-0" />
                <span className="font-heading text-xs sm:text-sm font-semibold text-foreground leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Link to="/waitlist">
              <Button size="lg" className="font-heading text-base px-8 py-4">
                Join the Waitlist
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/directory">
              <Button variant="neutral" size="lg" className="font-heading text-base px-8 py-4">
                Explore Locus
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
