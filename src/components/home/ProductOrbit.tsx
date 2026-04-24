/**
 * ProductOrbit — neobrutalist orbital map of Locus product surfaces.
 * Black hub at center with "LOCUS" wordmark, 6 yellow square nodes orbiting.
 * Click a node → opens a bento-style detail card centered over the hub.
 * Slow rotation pauses on hover or when a card is open. Respects reduced-motion.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Scale,
  BookOpen,
  Wrench,
  FileText,
  LineChart,
  X,
  type LucideIcon,
} from "lucide-react";

type ProductNode = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  tag: string;
  description: string;
  chips: string[];
  cta: string;
};

const NODES: ProductNode[] = [
  {
    id: "directory",
    label: "Directory",
    icon: Building2,
    href: "/directory",
    tag: "LIVE",
    description:
      "Searchable database of every Indian law firm, chamber, and company.",
    chips: ["3,890 firms", "28 cities"],
    cta: "Open Directory",
  },
  {
    id: "the-bar",
    label: "The Bar",
    icon: Scale,
    href: "/the-bar",
    tag: "LIVE",
    description:
      "Daily skill challenges judged on merit. Climb the leaderboard.",
    chips: ["Daily drills", "Live ranks"],
    cta: "Enter The Bar",
  },
  {
    id: "playbook",
    label: "Playbook",
    icon: BookOpen,
    href: "/playbook",
    tag: "LIVE",
    description:
      "Real internship case files. How others got in, in their words.",
    chips: ["5 dossiers", "More weekly"],
    cta: "Open Playbook",
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    href: "/tools",
    tag: "LIVE",
    description:
      "Generate NDAs, DPAs, internship letters in seconds.",
    chips: ["4 generators", "Free"],
    cta: "Open Tools",
  },
  {
    id: "resources",
    label: "Resources",
    icon: FileText,
    href: "/resources",
    tag: "LIVE",
    description:
      "CV templates, cold email scripts, research memos.",
    chips: ["8 templates", "PDF"],
    cta: "Open Resources",
  },
  {
    id: "tracker",
    label: "Tracker",
    icon: LineChart,
    href: "/applications",
    tag: "LIVE",
    description:
      "Log applications, track responses, never miss a follow-up.",
    chips: ["Pipeline view", "Reminders"],
    cta: "Open Tracker",
  },
];

const RADIUS = 150;
const NODE_SIZE = 64;

export default function ProductOrbit() {
  const reduceMotion = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number>();
  const lastTickRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFrozen = paused || activeId !== null;

  useEffect(() => {
    if (reduceMotion || isFrozen) return;
    const tick = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      setAngle((a) => (a + (dt / 1000) * 6) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [reduceMotion, isFrozen]);

  // Esc to close + click outside
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as globalThis.Node)
      ) {
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [activeId]);

  const activeNode = NODES.find((n) => n.id === activeId) ?? null;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="navigation"
      aria-label="Locus product map"
    >
      {/* Orbit ring */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="-220 -220 440 440"
        aria-hidden
      >
        <circle
          cx="0"
          cy="0"
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--foreground) / 0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Center hub — fades when a card is open */}
      <motion.div
        animate={{ opacity: activeId ? 0 : 1, scale: activeId ? 0.9 : 1 }}
        transition={{ duration: 0.15 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                   flex h-24 w-24 items-center justify-center rounded-xl
                   border-2 border-foreground bg-foreground text-background
                   shadow-[6px_6px_0_0_hsl(var(--accent))]
                   pointer-events-none"
      >
        <span className="font-heading text-xl font-black tracking-tight">
          loc<span className="text-accent">us</span>
        </span>
      </motion.div>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const a = ((i / NODES.length) * 360 + angle - 90) * (Math.PI / 180);
        const x = Math.cos(a) * RADIUS;
        const y = Math.sin(a) * RADIUS;
        const Icon = node.icon;
        const isHovered = hovered === i;
        const isActive = activeId === node.id;

        return (
          <button
            key={node.id}
            type="button"
            aria-label={node.label}
            aria-expanded={isActive}
            onClick={(e) => {
              e.stopPropagation();
              setActiveId((cur) => (cur === node.id ? null : node.id));
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            className="group absolute left-1/2 top-1/2 z-20 flex flex-col items-center"
            style={{
              width: NODE_SIZE,
              height: NODE_SIZE,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              transition: reduceMotion ? "none" : "transform 0.05s linear",
            }}
          >
            <div
              className={`flex h-full w-full items-center justify-center rounded-lg
                          border-2 border-foreground bg-accent text-accent-foreground
                          shadow-[3px_3px_0_0_hsl(var(--foreground))]
                          transition-all duration-150
                          group-hover:-translate-x-0.5 group-hover:-translate-y-0.5
                          group-hover:shadow-[5px_5px_0_0_hsl(var(--foreground))]
                          group-focus-visible:-translate-x-0.5 group-focus-visible:-translate-y-0.5
                          group-focus-visible:shadow-[5px_5px_0_0_hsl(var(--foreground))]
                          ${isActive ? "-translate-x-0.5 -translate-y-0.5 shadow-[5px_5px_0_0_hsl(var(--foreground))] ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
            >
              <Icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            {/* Label badge */}
            <span
              className={`pointer-events-none absolute -bottom-7 whitespace-nowrap
                          rounded border-2 border-foreground bg-background px-2 py-0.5
                          font-mono text-[10px] font-bold uppercase tracking-wider
                          text-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]
                          transition-opacity duration-150
                          ${isHovered && !isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            >
              {node.label}
            </span>
          </button>
        );
      })}

      {/* Detail card — centered over hub */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2
                       w-[min(340px,82%)]
                       rounded-md border-2 border-foreground bg-background
                       shadow-[6px_6px_0_0_hsl(var(--accent))]
                       p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${activeNode.label} details`}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="Close"
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center
                         rounded border-2 border-foreground bg-background text-foreground
                         hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>

            {/* Tag */}
            <span
              className="inline-block rounded border-2 border-foreground bg-accent
                         px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase
                         tracking-wider text-accent-foreground"
            >
              {activeNode.tag}
            </span>

            {/* Title */}
            <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground">
              {activeNode.label}
            </h3>

            {/* Description */}
            <p className="mt-1.5 text-sm leading-snug text-foreground/70">
              {activeNode.description}
            </p>

            {/* Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeNode.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded border border-foreground/30 bg-foreground/5
                             px-2 py-0.5 font-mono text-[10px] font-semibold
                             uppercase tracking-wide text-foreground/80"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Link
              to={activeNode.href}
              className="group mt-4 inline-flex w-full items-center justify-center gap-2
                         rounded border-2 border-foreground bg-foreground
                         px-4 py-2 font-heading text-sm font-bold text-background
                         shadow-[3px_3px_0_0_hsl(var(--accent))]
                         hover:-translate-x-0.5 hover:-translate-y-0.5
                         hover:shadow-[5px_5px_0_0_hsl(var(--accent))]
                         transition-all"
            >
              {activeNode.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
