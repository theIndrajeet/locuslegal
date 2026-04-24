/**
 * HomeHero — static two-column hero matching the bento tile language below.
 * Left: indictment headline + subhead + CTAs.
 * Right: "Exhibit A" stat tile (yellow, bordered, hard shadow) with a one-shot
 * count-up on the 5,00,000 number. No rotation, no morph, no flicker.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FallingPattern } from "@/components/ui/falling-pattern";

const TARGET = 500000;
const COUNT_MS = 1200;

function useCountUp(target: number, durationMs: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : target);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    if (started.current) return;
    started.current = true;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, target, durationMs]);

  return value;
}

export default function RotatingHero() {
  const reduceMotion = useReducedMotion();
  const count = useCountUp(TARGET, COUNT_MS, !reduceMotion);
  const formatted = count.toLocaleString("en-IN");

  // Stagger helpers — single mount-only fade-up.
  const fade = (i: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
        };

  return (
    <section
      aria-label="Locus introduction"
      className="relative min-h-[88vh] flex items-center overflow-hidden"
    >
      <FallingPattern className="z-0" />
      <div className="absolute inset-0 bg-background/40 z-[1]" />
      {/* Soft yellow glow anchored mid-left */}
      <div
        aria-hidden
        className="absolute left-[15%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.16) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT — pitch */}
          <div className="lg:col-span-7">
            <motion.p
              {...fade(0)}
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-foreground/55 mb-6"
            >
              For the 5 lakh law students India ignores
            </motion.p>

            <motion.h1
              {...fade(1)}
              className="font-heading font-semibold leading-[1.05] tracking-tight text-foreground text-4xl sm:text-5xl lg:text-6xl mb-6"
            >
              Law school in India is a lottery.{" "}
              <span className="text-accent">We're the way out.</span>
            </motion.h1>

            <motion.p
              {...fade(2)}
              className="text-base sm:text-lg text-foreground/70 leading-relaxed max-w-[60ch] mb-9"
            >
              26 NLUs get the firms. The other 5,00,000 get a placement cell that
              doesn't have a plan. Locus is the plan.
            </motion.p>

            <motion.div
              {...fade(3)}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
            >
              <Button
                asChild
                size="lg"
                className="font-heading text-base px-7 h-12 group bg-accent text-accent-foreground border-2 border-foreground hover:bg-accent shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Link to="/waitlist">
                  Join the waitlist
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-heading text-base px-7 h-12 bg-transparent text-foreground border-2 border-foreground/40 hover:border-accent hover:text-accent hover:bg-transparent transition-colors"
              >
                <Link to="/directory">Browse the directory</Link>
              </Button>
            </motion.div>
          </div>

          {/* RIGHT — Exhibit A receipts tile */}
          <motion.div {...fade(4)} className="lg:col-span-5">
            <Link
              to="/directory"
              className="group relative block rounded-2xl border-2 border-foreground bg-accent text-accent-foreground p-7 sm:p-8 shadow-[8px_8px_0_0_hsl(var(--foreground))] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_hsl(var(--foreground))]"
            >
              {/* Top row: icon + EXHIBIT A stamp */}
              <div className="flex items-start justify-between mb-6">
                <div className="rounded-md bg-foreground text-accent p-2.5 border-2 border-foreground">
                  <Scale className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] bg-foreground text-accent px-2.5 py-1 rounded">
                  Exhibit A
                </span>
              </div>

              {/* Hero stat */}
              <div
                aria-label={`${TARGET.toLocaleString("en-IN")} law students in India`}
                className="font-heading text-[64px] sm:text-7xl lg:text-[88px] font-black leading-none tracking-tight tabular-nums text-foreground"
              >
                {formatted}
              </div>
              <div className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">
                Law students · India · 2025
              </div>

              {/* Divider */}
              <div className="my-6 h-[2px] w-full bg-foreground/90" />

              {/* Support rows */}
              <ul className="space-y-3 font-mono text-sm text-foreground">
                <li className="flex items-baseline gap-4">
                  <span className="font-heading text-2xl font-black tabular-nums w-20">26</span>
                  <span className="opacity-80">NLUs in India</span>
                </li>
                <li className="flex items-baseline gap-4">
                  <span className="font-heading text-2xl font-black tabular-nums w-20">3,890</span>
                  <span className="opacity-80">firms in the Locus directory</span>
                </li>
                <li className="flex items-baseline gap-4">
                  <span className="font-heading text-2xl font-black tabular-nums w-20">1</span>
                  <span className="opacity-80">platform built for everyone else</span>
                </li>
              </ul>

              {/* Corner arrow */}
              <ArrowUpRight
                className="absolute bottom-5 right-5 h-5 w-5 text-foreground/60 group-hover:text-foreground transition-colors"
                strokeWidth={2.5}
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
