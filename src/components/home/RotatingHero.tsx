/**
 * RotatingHero — homepage hero that cycles through 3 story angles.
 *
 * Testing checklist:
 * 1. Page loads → Angle 1 visible → after 7s smoothly crossfades to Angle 2 → then Angle 3 → loops to Angle 1
 * 2. Hover anywhere in the hero → rotation pauses → mouse leaves → 2s later rotation resumes
 * 3. Click progress dot 3 → jumps to Angle 3, timer resets
 * 4. Tab to primary CTA → rotation pauses while focused
 * 5. prefers-reduced-motion → only Angle 2 (PROMISE) renders, no rotation
 * 6. Tab visibility: switch tabs for 30s → return → rotation resumes from current angle (no glitch jump)
 * 7. Mobile: all three angles fit, CTAs stack, no overflow
 * 8. Header: no JOIN WAITLIST button
 * 9. Secondary CTA still routes to /waitlist
 * 10. aria-live="polite" announces angle changes
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FallingPattern } from "@/components/ui/falling-pattern";
import HeroAngle, { type HeroAngleData } from "./HeroAngle";

const DWELL_MS = 7000;
const RESUME_DELAY_MS = 2000;
const TRANSITION_MS = 0.3;

const ANGLES: HeroAngleData[] = [
  {
    id: "indictment",
    eyebrow: "FOR THE 5,00,000 LAW STUDENTS INDIA IGNORES",
    headlineLines: [
      { text: "26 NLUs get the firms." },
      { text: "The rest of you get nothing." },
      { text: "We're fixing that.", accent: true },
    ],
    primaryCta: { label: "Start with the directory", href: "/directory" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    id: "promise",
    eyebrow: "BUILT FOR NON-NLU LAW STUDENTS IN INDIA",
    headlineLines: [
      { text: "Prove you can lawyer." },
      { text: "Get seen." },
      { text: "Get hired.", accent: true },
    ],
    subheadline: "Not because of where you studied. Because of what you can do.",
    primaryCta: { label: "See what's inside", scrollTo: "features" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    id: "alternative",
    eyebrow: "ALTERNATIVES DON'T EXIST",
    headlineLines: [
      { text: "LinkedIn won't show you every firm." },
      { text: "Your college won't give you templates." },
      { text: "Your placement cell doesn't have a plan." },
      { text: "Locus does.", accent: true },
    ],
    primaryCta: { label: "Explore Locus", scrollTo: "features" },
    secondaryCta: { label: "Join the waitlist", href: "/waitlist" },
  },
];

const DOT_LABELS = ["Why", "What", "How"];

export default function RotatingHero() {
  const reduceMotion = useReducedMotion();
  // When reduced motion: render Angle 2 (PROMISE) statically.
  const [index, setIndex] = useState(reduceMotion ? 1 : 0);
  const [paused, setPaused] = useState(false);

  const dwellTimer = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (dwellTimer.current) window.clearTimeout(dwellTimer.current);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    dwellTimer.current = null;
    resumeTimer.current = null;
  };

  // Auto-rotation
  useEffect(() => {
    if (reduceMotion || paused) return;
    dwellTimer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % ANGLES.length);
    }, DWELL_MS);
    return () => {
      if (dwellTimer.current) window.clearTimeout(dwellTimer.current);
    };
  }, [index, paused, reduceMotion]);

  // Pause when tab hidden, resume when visible (no glitch-jumping)
  useEffect(() => {
    if (reduceMotion) return;
    const onVisibility = () => {
      if (document.hidden) {
        setPaused(true);
      } else {
        // small delay before resume
        if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
        resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_DELAY_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reduceMotion]);

  useEffect(() => () => clearTimers(), []);

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

  const current = ANGLES[index];

  return (
    <section
      aria-live="polite"
      aria-label="Locus introduction"
      className="relative min-h-[88vh] flex items-center overflow-hidden"
      onMouseEnter={pauseNow}
      onMouseLeave={scheduleResume}
    >
      <FallingPattern className="z-0" />
      <div className="absolute inset-0 bg-background/40 z-[1]" />
      {/* Subtle yellow radial glow behind headline */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.18) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-28">
        <div className="max-w-4xl mx-auto">
          {/* SVG goo threshold filter — merges blurred letters into liquid blobs */}
          <svg className="absolute h-0 w-0" aria-hidden>
            <defs>
              <filter id="hero-goo">
                <feColorMatrix
                  in="SourceGraphic"
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 22 -10"
                />
              </filter>
            </defs>
          </svg>

          <div
            className="relative"
            style={reduceMotion ? undefined : { filter: "url(#hero-goo)" }}
          >
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={current.id}
                initial={reduceMotion ? false : { opacity: 0, filter: "blur(14px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={reduceMotion ? undefined : { opacity: 0, filter: "blur(14px)", position: "absolute" }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
                style={{ top: 0, left: 0, right: 0 }}
              >
                <HeroAngle
                  angle={current}
                  onCtaFocusChange={(focused) => (focused ? pauseNow() : scheduleResume())}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {!reduceMotion && (
            <div
              className="flex justify-center items-center gap-3 mt-12"
              onMouseEnter={pauseNow}
              onMouseLeave={scheduleResume}
            >
              {ANGLES.map((a, i) => {
                const active = i === index;
                return (
                  <button
                    key={a.id}
                    onClick={() => jumpTo(i)}
                    aria-label={`Show angle ${i + 1}: ${DOT_LABELS[i]}`}
                    aria-current={active ? "true" : undefined}
                    className="group flex flex-col items-center gap-1.5 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    <span
                      className={`block h-2.5 rounded-full transition-all ${
                        active
                          ? "w-8 bg-accent"
                          : "w-2.5 border border-muted-foreground/60 bg-transparent group-hover:border-accent"
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        active ? "text-accent" : "text-muted-foreground/70 group-hover:text-foreground"
                      }`}
                    >
                      {DOT_LABELS[i]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
