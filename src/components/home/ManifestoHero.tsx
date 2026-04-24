import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { TimelineContent, textVariants, revealVariants } from "@/components/ui/timeline-animation";
import { DottedVitruvian } from "@/components/ui/dotted-vitruvian";

/**
 * ManifestoHero — homepage flagship hero.
 * Pure black canvas, mono technical chrome, ALL-CAPS Sora headline,
 * dotted Vitruvian Man on the right (desktop only).
 * Yellow used sparingly: corner brackets, "001" marker, primary CTA, navel dot.
 */

const Bracket = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 8 V2 H8" />
    <path d="M22 8 V2 H16" strokeOpacity="0" />
  </svg>
);

const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const styleMap: Record<typeof pos, CSSProperties> = {
    tl: { top: 16, left: 16, transform: "rotate(0deg)" },
    tr: { top: 16, right: 16, transform: "rotate(90deg)" },
    bl: { bottom: 16, left: 16, transform: "rotate(-90deg)" },
    br: { bottom: 16, right: 16, transform: "rotate(180deg)" },
  };
  return (
    <div className="absolute z-20 text-accent" style={styleMap[pos]}>
      <Bracket className="w-5 h-5 md:w-6 md:h-6" />
    </div>
  );
};

export default function ManifestoHero() {
  return (
    <section className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      {/* Faint dotted-grid background (mobile gets this as its texture) */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Corner brackets */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* TOP CHROME */}
      <TimelineContent
        index={0}
        variants={textVariants}
        className="absolute top-0 left-0 right-0 z-10 pt-20 md:pt-24 px-6 md:px-12"
      >
        <div className="flex items-center justify-between font-mono text-[10px] md:text-xs tracking-[0.2em] text-white/60 uppercase">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-white font-semibold">LOCUS</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline">EST. 2025</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span>3,890 FIRMS</span>
            <span className="text-white/30">·</span>
            <span>28 CITIES</span>
          </div>
        </div>
      </TimelineContent>

      {/* MAIN CONTENT */}
      <div className="relative z-10 min-h-screen flex items-center pt-24 pb-24 md:pt-32 md:pb-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-8 items-center">
            {/* LEFT: Copy */}
            <div className="max-w-2xl">
              {/* Section marker */}
              <TimelineContent
                index={1}
                variants={textVariants}
                className="flex items-center gap-3 mb-8 md:mb-12"
              >
                <span className="font-mono text-xs text-accent font-semibold tracking-[0.2em]">001</span>
                <span className="h-px w-10 bg-accent/60" />
                <span className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-white/50 uppercase">
                  The Operating System
                </span>
              </TimelineContent>

              {/* Headline */}
              <h1 className="font-heading font-black uppercase leading-[0.92] tracking-[-0.035em] text-[44px] sm:text-6xl lg:text-7xl xl:text-[88px] mb-8 md:mb-10">
                <TimelineContent as="span" index={2} variants={textVariants} className="block">
                  Everything
                </TimelineContent>
                <TimelineContent as="span" index={3} variants={textVariants} className="block">
                  A Law Student
                </TimelineContent>
                <TimelineContent as="span" index={4} variants={textVariants} className="block">
                  Actually <span className="text-accent">Needs.</span>
                </TimelineContent>
              </h1>

              {/* Sub */}
              <TimelineContent
                index={5}
                variants={textVariants}
                className="mb-10 md:mb-12 max-w-xl"
              >
                <p className="text-base md:text-lg text-white/65 leading-relaxed">
                  Directory. Skill challenges. Templates. Tracker.
                  <br className="hidden sm:inline" />
                  Built on merit, not pedigree.
                </p>
              </TimelineContent>

              {/* CTAs */}
              <TimelineContent
                index={6}
                variants={revealVariants}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Link
                  to="/waitlist"
                  className="group inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-mono font-semibold text-xs md:text-sm tracking-[0.2em] uppercase px-6 py-4 hover:bg-white hover:text-black transition-colors"
                >
                  Join Waitlist
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#features"
                  className="group inline-flex items-center justify-center gap-2 border border-white/30 text-white font-mono font-semibold text-xs md:text-sm tracking-[0.2em] uppercase px-6 py-4 hover:border-white hover:bg-white/5 transition-colors"
                >
                  Explore Features
                  <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
                </a>
              </TimelineContent>
            </div>

            {/* RIGHT: Vitruvian (desktop only) */}
            <div className="hidden lg:flex items-center justify-center relative">
              <div className="relative w-full max-w-[460px] aspect-[400/460] text-white">
                <DottedVitruvian className="w-full h-full" />
                {/* Tiny tech label */}
                <div className="absolute -bottom-2 right-2 font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
                  FIG.001 · IDEAL FORM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CHROME */}
      <TimelineContent
        index={7}
        variants={textVariants}
        className="absolute bottom-0 left-0 right-0 z-10 pb-20 md:pb-8 px-6 md:px-12"
      >
        <div className="flex items-center justify-between font-mono text-[10px] md:text-xs tracking-[0.2em] text-white/60 uppercase gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <span className="hidden sm:inline text-white">SYSTEM.ACTIVE</span>
            <span className="sm:hidden text-white">SYS.ACT</span>
            <div className="flex gap-[3px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-2.5 md:w-2 md:h-3 bg-white/20 animate-[pulse_2.4s_ease-in-out_infinite]"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    backgroundColor: i < 5 ? "hsl(var(--accent))" : undefined,
                  }}
                />
              ))}
            </div>
            <span className="hidden md:inline">V1.0.0</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <span className="text-accent">●</span>
            <span className="hidden sm:inline">RENDERING</span>
            <span className="hidden md:inline text-white/30">·</span>
            <span>FRAME: ∞</span>
          </div>
        </div>
      </TimelineContent>
    </section>
  );
}
