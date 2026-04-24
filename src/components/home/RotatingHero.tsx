/**
 * RotatingHero — homepage hero with the migrated Waitlist pitch
 * (RainbowButton eyebrow + GooeyText morph headline + 3 audience CTAs)
 * over the new floating ShapeLandingBg background.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { RainbowButton } from "@/components/ui/rainbow-button";
import ShapeLandingBg from "@/components/ui/shape-landing-bg";

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

          <p
            className={`text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            India's first merit-based legal internship platform. We connect ambitious
            law students with top firms — no matter which college they come from.
            Sign up now — spots are limited.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/waitlist#waitlist">
              <Button size="lg" className="font-heading text-base px-8 py-4">
                I'm a Student
              </Button>
            </a>
            <a href="/waitlist#waitlist">
              <Button variant="neutral" size="lg" className="font-heading text-base px-8 py-4">
                I'm a Firm / Chamber
              </Button>
            </a>
            <a href="/waitlist#waitlist">
              <Button variant="neutral" size="lg" className="font-heading text-base px-8 py-4">
                I'm a School
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
