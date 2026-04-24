/**
 * ProductOrbit — neobrutalist orbital map of Locus product surfaces.
 * Black hub at center with "LOCUS" wordmark, 6 yellow square nodes orbiting.
 * Slow rotation, pauses on hover, respects reduced-motion. Click → route.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import {
  Building2,
  Scale,
  BookOpen,
  Wrench,
  FileText,
  LineChart,
  type LucideIcon,
} from "lucide-react";

type Node = {
  label: string;
  short: string;
  icon: LucideIcon;
  href: string;
};

const NODES: Node[] = [
  { label: "Directory", short: "Firms", icon: Building2, href: "/directory" },
  { label: "The Bar", short: "Skills", icon: Scale, href: "/the-bar" },
  { label: "Playbook", short: "Guides", icon: BookOpen, href: "/playbook" },
  { label: "Tools", short: "Drafts", icon: Wrench, href: "/tools" },
  { label: "Resources", short: "Templates", icon: FileText, href: "/resources" },
  { label: "Tracker", short: "Apps", icon: LineChart, href: "/applications" },
];

const RADIUS = 150;
const NODE_SIZE = 64;

export default function ProductOrbit() {
  const reduceMotion = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number>();
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const tick = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      // ~6 degrees per second — full rotation in 60s
      setAngle((a) => (a + (dt / 1000) * 6) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [reduceMotion, paused]);

  return (
    <div
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

      {/* Center hub */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                   flex h-24 w-24 items-center justify-center rounded-xl
                   border-2 border-foreground bg-foreground text-background
                   shadow-[6px_6px_0_0_hsl(var(--accent))]"
      >
        <span className="font-heading text-xl font-black tracking-tight">
          loc<span className="text-accent">us</span>
        </span>
      </div>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const a = ((i / NODES.length) * 360 + angle - 90) * (Math.PI / 180);
        const x = Math.cos(a) * RADIUS;
        const y = Math.sin(a) * RADIUS;
        const Icon = node.icon;
        const isHovered = hovered === i;

        return (
          <Link
            key={node.label}
            to={node.href}
            aria-label={node.label}
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
                          group-focus-visible:shadow-[5px_5px_0_0_hsl(var(--foreground))]`}
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
                          ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            >
              {node.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
