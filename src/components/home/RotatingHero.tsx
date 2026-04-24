/**
 * HomeHero — neobrutalist hero with pitch on the left and the
 * Locus product orbit on the right. No big "lottery" headline; the
 * 5,00,000 stat now lives in FeatureBento as Exhibit A.
 */
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FallingPattern } from "@/components/ui/falling-pattern";
import ProductOrbit from "@/components/home/ProductOrbit";

export default function RotatingHero() {
  const reduceMotion = useReducedMotion();

  const fade = (i: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
        };

  return (
    <section
      aria-label="Locus introduction"
      className="relative min-h-[88vh] flex items-center overflow-hidden"
    >
      <FallingPattern className="z-0" />
      <div className="absolute inset-0 bg-background/40 z-[1]" />
      <div
        aria-hidden
        className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none z-[1]"
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
              Locus · For India's law students
            </motion.p>

            <motion.h1
              {...fade(1)}
              className="font-heading font-semibold leading-[1.05] tracking-tight text-foreground text-4xl sm:text-5xl lg:text-6xl mb-6"
            >
              Everything law school{" "}
              <span className="text-accent">forgot to give you.</span>
            </motion.h1>

            <motion.p
              {...fade(2)}
              className="text-base sm:text-lg text-foreground/70 leading-relaxed max-w-[60ch] mb-9"
            >
              A directory of 3,890 firms. Daily skill challenges. Templates,
              tools, and a tracker. One platform — built on merit, not pedigree.
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

          {/* RIGHT — Product orbit */}
          <motion.div {...fade(4)} className="lg:col-span-5">
            <ProductOrbit />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
