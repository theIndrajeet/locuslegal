import { useEffect, useState } from "react";
import BackgroundPathsAnimation from "@/components/ui/background-paths";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export default function Hero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <BackgroundPathsAnimation />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />
      
      <div className="container mx-auto px-4 md:px-8 relative z-10 py-32">
        <div className="max-w-3xl">
          <span
            className={`inline-block mb-8 px-5 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent font-heading text-sm font-semibold tracking-widest uppercase transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your merit. Your internship.
          </span>
          
          <h1
            className={`font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8 text-white transition-all duration-700 delay-150 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Get the internship you deserve —{" "}
            <span className="text-accent">not the one your college got you.</span>
          </h1>
          
          <p
            className={`text-lg md:text-xl text-white/70 max-w-xl mb-12 leading-relaxed transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            India's first merit-based legal internship platform. We connect ambitious law students with top firms — no matter which college they come from.
          </p>
          
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="#waitlist">
              <InteractiveHoverButton text="I'm a Student" className="border-accent bg-accent text-accent-foreground font-heading text-base px-8 py-4" />
            </a>
            <a href="#waitlist">
              <InteractiveHoverButton text="I'm a Firm" className="border-white/30 bg-transparent text-white font-heading text-base px-8 py-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
