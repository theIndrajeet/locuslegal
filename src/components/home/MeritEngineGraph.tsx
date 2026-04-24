import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MeritEngineGraph — live constellation of students ↔ firms.
 * Pure SVG + framer-motion. No three.js, no canvas.
 * Black/white/yellow only. Visualizes Locus's actual thesis:
 * students get matched to firms by merit, in real time.
 *
 * Exposes onMatch(label) so the surrounding hero chrome can
 * mirror the currently-active match in its bottom-right strip.
 */

type Node = {
  id: string;
  x: number; // 0–100 viewBox units
  y: number;
  kind: "student" | "firm";
  label: string;
  sub: string;
};

const STUDENTS: Omit<Node, "kind">[] = [
  { id: "s1",  x: 18, y: 22, label: "NLU-D · 2026",      sub: "8.4 CGPA · CORP" },
  { id: "s2",  x: 32, y: 14, label: "NUJS · 2025",       sub: "MOOTS · IP"      },
  { id: "s3",  x: 48, y: 20, label: "NLSIU · 2027",      sub: "9.1 · LITIG"     },
  { id: "s4",  x: 62, y: 12, label: "GLC-MUM · 2026",    sub: "TIER-3 · 8.2"    },
  { id: "s5",  x: 78, y: 24, label: "JINDAL · 2025",     sub: "PUB · DEALS"     },
  { id: "s6",  x: 22, y: 38, label: "NALSAR · 2026",     sub: "ARB · 8.7"       },
  { id: "s7",  x: 40, y: 44, label: "ILS PUNE · 2027",   sub: "TIER-2 · MOOT"   },
  { id: "s8",  x: 58, y: 40, label: "SYM-NOIDA · 2026",  sub: "TAX · 8.0"       },
  { id: "s9",  x: 74, y: 46, label: "CNLU · 2025",       sub: "TIER-3 · 8.6"    },
  { id: "s10", x: 16, y: 58, label: "NLU-J · 2027",      sub: "ENV · 8.3"       },
  { id: "s11", x: 34, y: 64, label: "DSNLU · 2026",      sub: "CRIM · 8.1"      },
  { id: "s12", x: 50, y: 70, label: "RGNUL · 2025",      sub: "M&A · 8.9"       },
  { id: "s13", x: 66, y: 64, label: "HNLU · 2026",       sub: "BANK · 8.4"      },
  { id: "s14", x: 80, y: 70, label: "NUSRL · 2027",      sub: "POL · 8.2"       },
  { id: "s15", x: 26, y: 82, label: "MNLU · 2025",       sub: "DR · 8.5"        },
  { id: "s16", x: 46, y: 88, label: "TNNLU · 2026",      sub: "TECH · 8.0"      },
  { id: "s17", x: 64, y: 84, label: "DU LAW · 2025",     sub: "CONST · 8.6"     },
];

const FIRMS: Omit<Node, "kind">[] = [
  { id: "f1", x:  6, y:  8, label: "AZB",       sub: "M&A · MUM"      },
  { id: "f2", x: 92, y:  8, label: "JSA",       sub: "CORP · DEL"     },
  { id: "f3", x:  4, y: 30, label: "CAM",       sub: "BANK · MUM"     },
  { id: "f4", x: 94, y: 32, label: "SAM",       sub: "DEAL · DEL"     },
  { id: "f5", x:  6, y: 54, label: "TT&A",      sub: "DR · DEL"       },
  { id: "f6", x: 94, y: 56, label: "L&L",       sub: "REG · MUM"      },
  { id: "f7", x:  8, y: 78, label: "KCO",       sub: "IP · DEL"       },
  { id: "f8", x: 92, y: 80, label: "INDUSLAW",  sub: "VC · BLR"       },
  { id: "f9", x: 36, y:  4, label: "TRILEGAL",  sub: "CORP · DEL"     },
  { id: "f10",x: 70, y:  4, label: "DSK",       sub: "RE · MUM"       },
  { id: "f11",x: 38, y: 96, label: "KHAITAN",   sub: "TAX · KOL"      },
  { id: "f12",x: 68, y: 96, label: "PHOENIX",   sub: "ARB · DEL"      },
];

const ALL: Node[] = [
  ...STUDENTS.map((n) => ({ ...n, kind: "student" as const })),
  ...FIRMS.map((n) => ({ ...n, kind: "firm" as const })),
];

// Pre-baked "ambient" connections (faint background lines) — student → nearest firm
const AMBIENT: { from: Node; to: Node }[] = STUDENTS.map((s) => {
  let best = FIRMS[0];
  let bestD = Infinity;
  for (const f of FIRMS) {
    const d = Math.hypot(s.x - f.x, s.y - f.y);
    if (d < bestD) { bestD = d; best = f; }
  }
  return {
    from: { ...s, kind: "student" as const },
    to: { ...best, kind: "firm" as const },
  };
});

interface Props {
  onMatch?: (label: string) => void;
}

export default function MeritEngineGraph({ onMatch }: Props) {
  const [active, setActive] = useState<{ s: Node; f: Node; n: number } | null>(null);
  const counterRef = useRef(247);

  // Cycle through random student→firm matches every 2.4s
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const s = STUDENTS[Math.floor(Math.random() * STUDENTS.length)];
      const f = FIRMS[Math.floor(Math.random() * FIRMS.length)];
      counterRef.current += 1;
      const m = {
        s: { ...s, kind: "student" as const },
        f: { ...f, kind: "firm" as const },
        n: counterRef.current,
      };
      setActive(m);
      onMatch?.(
        `MATCH ${String(m.n).padStart(4, "0")} · ${s.label.split(" ·")[0]} → ${f.label}`
      );
    };
    tick();
    const id = setInterval(tick, 2400);
    return () => { alive = false; clearInterval(id); };
  }, [onMatch]);

  // Subtle parallax on mouse move (within container only)
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMouseMove = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: px * 6, y: py * 6 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  const pathFor = (a: Node, b: Node) => {
    // Slight curve via control point pulled toward center
    const mx = (a.x + b.x) / 2 + (50 - (a.x + b.x) / 2) * 0.15;
    const my = (a.y + b.y) / 2 + (50 - (a.y + b.y) / 2) * 0.15;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  };

  const ambientPaths = useMemo(
    () => AMBIENT.map((c, i) => ({ d: pathFor(c.from, c.to), i })),
    []
  );

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onLeave}
      className="relative w-full h-full select-none"
      style={{
        transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
        transition: "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformStyle: "preserve-3d",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Ambient faint connections */}
        <g stroke="currentColor" strokeWidth="0.12" fill="none" className="text-white/15">
          {ambientPaths.map((p) => (
            <path key={p.i} d={p.d} strokeDasharray="0.6 0.8" />
          ))}
        </g>

        {/* Active match line — animated draw */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.path
              key={`${active.s.id}-${active.f.id}-${active.n}`}
              d={pathFor(active.s, active.f)}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="0.35"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                pathLength: { duration: 0.7, ease: "easeOut" },
                opacity: { duration: 0.3 },
              }}
            />
          )}
        </AnimatePresence>

        {/* Firm nodes — squares */}
        {FIRMS.map((f) => {
          const isActive = active?.f.id === f.id;
          return (
            <g key={f.id}>
              <rect
                x={f.x - 1.1}
                y={f.y - 1.1}
                width={2.2}
                height={2.2}
                fill={isActive ? "hsl(var(--accent))" : "transparent"}
                stroke={isActive ? "hsl(var(--accent))" : "currentColor"}
                strokeWidth="0.18"
                className={isActive ? "" : "text-white/55"}
              />
              <text
                x={f.x}
                y={f.y + 3.6}
                textAnchor="middle"
                fontSize="1.5"
                fontFamily="ui-monospace, Menlo, monospace"
                letterSpacing="0.08"
                fill="currentColor"
                className={isActive ? "text-accent" : "text-white/45"}
              >
                {f.label}
              </text>
            </g>
          );
        })}

        {/* Student nodes — dotted circles */}
        {STUDENTS.map((s) => {
          const isActive = active?.s.id === s.id;
          return (
            <g key={s.id}>
              <circle
                cx={s.x}
                cy={s.y}
                r={isActive ? 1.3 : 0.9}
                fill={isActive ? "hsl(var(--accent))" : "currentColor"}
                className={isActive ? "" : "text-white/65"}
              />
              {isActive && (
                <motion.circle
                  cx={s.x}
                  cy={s.y}
                  r={1.3}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="0.2"
                  initial={{ r: 1.3, opacity: 0.9 }}
                  animate={{ r: 4.5, opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              )}
            </g>
          );
        })}

        {/* Active match floating label, near student */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.g
              key={`lbl-${active.n}`}
              initial={{ opacity: 0, y: 1 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <text
                x={active.s.x}
                y={active.s.y - 2.2}
                textAnchor="middle"
                fontSize="1.4"
                fontFamily="ui-monospace, Menlo, monospace"
                letterSpacing="0.1"
                fill="hsl(var(--accent))"
                fontWeight={700}
              >
                {active.s.sub}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Tech label */}
      <div className="absolute -bottom-2 right-2 font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
        FIG.001 · MERIT ENGINE
      </div>
    </div>
  );
}
