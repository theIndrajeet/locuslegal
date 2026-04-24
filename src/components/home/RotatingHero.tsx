/**
 * RotatingHero — left-half hero with a fixed anchor question and a morphing punchline.
 *
 * Layout: anchor "Where do the other 5 lakh go?" stays put on the left half.
 * Below it, a single GooeyText line morphs through 3 angle answers.
 * Right half is reserved (empty) for future content.
 *
 * Hybrid interaction: 7s auto-advance + progress bar + 01/03 counter + arrow keys + click dots.
 * Hover/focus pauses; reduced-motion shows angle 2 statically.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import HeroAngle, { type HeroAngleData } from "./HeroAngle";

const DWELL_MS = 7000;
const RESUME_DELAY_MS = 2000;

const ANGLES: HeroAngleData[] = [
  {
    id: "indictment",
    eyebrow: "FOR THE 5,00,000 LAW STUDENTS INDIA IGNORES",
    morphLine: "26 NLUs get the firms. The rest get nothing.",
    subheadline: "We're fixing that — starting with a directory of every firm worth knowing.",
    primaryCta: { label: "Start with the directory", href: "/directory" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    id: "promise",
    eyebrow: "BUILT FOR NON-NLU LAW STUDENTS IN INDIA",
    morphLine: "Prove you can lawyer. Get hired.",
    subheadline: "Not because of where you studied. Because of what you can do.",
    primaryCta: { label: "See what's inside", scrollTo: "features" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    id: "alternative",
    eyebrow: "ALTERNATIVES DON'T EXIST",
    morphLine: "Locus shows you every firm your college won't.",
    subheadline: "LinkedIn won't. Your placement cell can't. Your college doesn't have a plan.",
    primaryCta: { label: "Explore Locus", scrollTo: "features" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
];

const MORPH_TEXTS = ANGLES.map((a) => a.morphLine);

export default function RotatingHero() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(reduceMotion ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const dwellTimer = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const progressRaf = useRef<number | null>(null);
  const progressStart = useRef<number>(0);

  // Auto-advance + progress
  useEffect(() => {
    if (reduceMotion || paused) {
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
      return;
    }
    progressStart.current = performance.now();
    setProgress(0);

    const tick = (t: number) => {
      const elapsed = t - progressStart.current;
      const pct = Math.min(elapsed / DWELL_MS, 1);
      setProgress(pct);
      if (pct < 1) {
        progressRaf.current = requestAnimationFrame(tick);
      }
    };
    progressRaf.current = requestAnimationFrame(tick);

    dwellTimer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % ANGLES.length);
    }, DWELL_MS);

    return () => {
      if (dwellTimer.current) window.clearTimeout(dwellTimer.current);
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
    };
  }, [index, paused, reduceMotion]);

  // Pause on tab hidden
  useEffect(() => {
    if (reduceMotion) return;
    const onVisibility = () => {
      if (document.hidden) {
        setPaused(true);
      } else {
        if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
        resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_DELAY_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reduceMotion]);

  const pauseNow = () => {
    if (reduceMotion) return;
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    setPaused(true);
  };
  const scheduleResume = () => {
    if (reduceMotion) return;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  const jumpTo = (i: number) => {
    if (reduceMotion) return;
    if (dwellTimer.current) window.clearTimeout(dwellTimer.current);
    setIndex(i);
  };

  const goNext = () => jumpTo((index + 1) % ANGLES.length);
  const goPrev = () => jumpTo((index - 1 + ANGLES.length) % ANGLES.length);

  // Arrow-key nav when section has focus
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  const current = ANGLES[index];

  return (
    <section
      aria-live="polite"
      aria-label="Locus introduction"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative min-h-[88vh] flex items-center overflow-hidden focus:outline-none"
      onMouseEnter={pauseNow}
      onMouseLeave={scheduleResume}
    >
      <FallingPattern className="z-0" />
      <div className="absolute inset-0 bg-background/40 z-[1]" />
      {/* Soft yellow glow anchored to the left */}
      <div
        aria-hidden
        className="absolute left-[20%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.18) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT HALF — anchor + morphing line + per-angle bits */}
          <div className="lg:col-span-7 xl:col-span-6">
            {/* Fixed anchor — never changes */}
            <h1 className="font-heading font-semibold leading-[1.08] tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] mb-6">
              <span className="block">Where do the other</span>
              <span className="block">
                <span className="text-accent">5 lakh</span> go?
              </span>
            </h1>

            {/* Morphing punchline */}
            <div className="mb-3 min-h-[3.5rem] sm:min-h-[4rem]">
              {reduceMotion ? (
                <p className="font-heading text-xl sm:text-2xl lg:text-[1.6rem] font-medium text-foreground/85 leading-snug">
                  {MORPH_TEXTS[1]}
                </p>
              ) : (
                <GooeyText
                  texts={MORPH_TEXTS}
                  morphTime={1.1}
                  cooldownTime={(DWELL_MS / 1000) - 1.1}
                  className="w-full"
                  textClassName="font-heading text-xl sm:text-2xl lg:text-[1.6rem] font-medium text-foreground/85 leading-snug whitespace-nowrap"
                />
              )}
            </div>

            {/* Progress bar + counter */}
            {!reduceMotion && (
              <div className="flex items-center gap-3 mb-8 max-w-md">
                <div className="flex-1 h-[3px] bg-foreground/15 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-accent transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/60 tabular-nums">
                  {String(index + 1).padStart(2, "0")} / {String(ANGLES.length).padStart(2, "0")}
                </span>
              </div>
            )}

            {/* Per-angle: eyebrow + subheadline + CTAs (simple fade) */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <HeroAngle
                  angle={current}
                  onCtaFocusChange={(focused) => (focused ? pauseNow() : scheduleResume())}
                />
              </motion.div>
            </AnimatePresence>

            {/* Click-to-jump dots */}
            {!reduceMotion && (
              <div className="flex items-center gap-2 mt-8">
                {ANGLES.map((a, i) => {
                  const active = i === index;
                  return (
                    <button
                      key={a.id}
                      onClick={() => jumpTo(i)}
                      aria-label={`Show angle ${i + 1}`}
                      aria-current={active ? "true" : undefined}
                      className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        active
                          ? "w-8 bg-accent"
                          : "w-2 bg-foreground/25 hover:bg-foreground/50"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT HALF — reserved for future content */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-6" aria-hidden />
        </div>
      </div>
    </section>
  );
}
