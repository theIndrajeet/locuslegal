import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BackgroundPathsAnimation from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ArrowRight, ArrowDown } from "lucide-react";

export default function HomeHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <BackgroundPathsAnimation />
      <div className="absolute inset-0 bg-background/55 z-[1]" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-28">
        <div className="max-w-4xl mx-auto text-center">
          <RainbowButton
            className={`mb-8 font-heading text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The operating system for law students
          </RainbowButton>

          <h1
            className={`font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-foreground transition-all duration-700 delay-150 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Everything a law student in India{" "}
            <span className="text-accent">actually needs.</span>
          </h1>

          <p
            className={`text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            A directory of 3,890+ firms. Skill challenges that put you on the leaderboard. Templates, tools, and a tracker — all in one place. Built on merit, not pedigree.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Link to="/waitlist">
              <Button size="lg" className="font-heading text-base px-8 py-4 w-full sm:w-auto">
                Join the Waitlist <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="neutral" size="lg" className="font-heading text-base px-8 py-4 w-full sm:w-auto">
                Explore features <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
