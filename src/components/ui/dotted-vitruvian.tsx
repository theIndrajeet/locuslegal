import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

/**
 * Dotted Vitruvian Man — pure SVG point-cloud.
 * Geometry meets humanity: Da Vinci's frame (circle + square) with a
 * two-pose human figure (arms spread + arms raised) rendered as dots.
 *
 * Pure white dots on transparent bg, one yellow dot at the navel
 * (golden-ratio center) for brand pop.
 */

type Pt = { x: number; y: number; key: string };

const CX = 200;
const CY = 220;
const R = 170; // circle radius (Da Vinci's circle, centered on navel)
const SQ = 300; // square side (centered on navel-ish; figure's height ~= width)
const SQ_TOP = CY - SQ / 2 + 20;
const SQ_LEFT = CX - SQ / 2;

function circlePoints(cx: number, cy: number, r: number, count: number, prefix: string): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, key: `${prefix}-${i}` });
  }
  return pts;
}

function squarePoints(left: number, top: number, side: number, perSide: number, prefix: string): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < perSide; i++) {
    const t = i / (perSide - 1);
    pts.push({ x: left + side * t, y: top, key: `${prefix}-t-${i}` });
    pts.push({ x: left + side * t, y: top + side, key: `${prefix}-b-${i}` });
    pts.push({ x: left, y: top + side * t, key: `${prefix}-l-${i}` });
    pts.push({ x: left + side, y: top + side * t, key: `${prefix}-r-${i}` });
  }
  return pts;
}

function linePoints(x1: number, y1: number, x2: number, y2: number, count: number, prefix: string): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, key: `${prefix}-${i}` });
  }
  return pts;
}

function arcPoints(cx: number, cy: number, r: number, a1: number, a2: number, count: number, prefix: string): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = a1 + ((a2 - a1) * i) / (count - 1);
    pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, key: `${prefix}-${i}` });
  }
  return pts;
}

function buildPoints(): { frame: Pt[]; figure: Pt[]; navel: Pt } {
  // Frame: circle + square (low-density, structural)
  const circle = circlePoints(CX, CY, R, 96, "circ");
  const square = squarePoints(SQ_LEFT, SQ_TOP, SQ, 22, "sq");
  const frame = [...circle, ...square];

  // Figure: two-pose human silhouette (arms-spread + arms-raised, legs together + legs-spread)
  // Centered on navel (CX, CY).
  const navelY = CY;
  const headTop = navelY - 140;
  const headR = 22;
  const shoulderY = headTop + headR * 2 + 14;
  const hipY = navelY + 30;
  const groinY = navelY + 80;
  const feetY = SQ_TOP + SQ; // feet on square base

  const fig: Pt[] = [];

  // Head — circle outline
  fig.push(...arcPoints(CX, headTop + headR, headR, 0, Math.PI * 2, 28, "head"));

  // Neck
  fig.push(...linePoints(CX - 6, headTop + headR * 2, CX - 6, shoulderY, 4, "neck-l"));
  fig.push(...linePoints(CX + 6, headTop + headR * 2, CX + 6, shoulderY, 4, "neck-r"));

  // Torso outline (shoulders → hips), trapezoidal
  const shoulderHalf = 52;
  const hipHalf = 38;
  fig.push(...linePoints(CX - shoulderHalf, shoulderY, CX - hipHalf, hipY, 14, "torso-l"));
  fig.push(...linePoints(CX + shoulderHalf, shoulderY, CX + hipHalf, hipY, 14, "torso-r"));
  fig.push(...linePoints(CX - shoulderHalf, shoulderY, CX + shoulderHalf, shoulderY, 12, "shoulder"));
  fig.push(...linePoints(CX - hipHalf, hipY, CX + hipHalf, hipY, 10, "hip"));

  // ARMS — pose A: spread horizontal (touching circle at shoulder height ≈ 200°/340°)
  // Endpoints lie on the circle
  const armSpreadL = { x: CX - R + 4, y: shoulderY + 6 };
  const armSpreadR = { x: CX + R - 4, y: shoulderY + 6 };
  fig.push(...linePoints(CX - shoulderHalf, shoulderY, armSpreadL.x, armSpreadL.y, 22, "armA-l"));
  fig.push(...linePoints(CX + shoulderHalf, shoulderY, armSpreadR.x, armSpreadR.y, 22, "armA-r"));

  // ARMS — pose B: raised at ~45° above horizontal (touching circle upper)
  const angUp = Math.PI * 1.25; // upper-left
  const armUpL = { x: CX + Math.cos(angUp) * R, y: CY + Math.sin(angUp) * R };
  const armUpR = { x: CX + Math.cos(-Math.PI * 0.25) * R, y: CY + Math.sin(-Math.PI * 0.25) * R };
  fig.push(...linePoints(CX - shoulderHalf, shoulderY, armUpL.x, armUpL.y, 22, "armB-l"));
  fig.push(...linePoints(CX + shoulderHalf, shoulderY, armUpR.x, armUpR.y, 22, "armB-r"));

  // LEGS — pose A: together (vertical down to square base)
  fig.push(...linePoints(CX - 14, groinY, CX - 14, feetY, 22, "legA-l"));
  fig.push(...linePoints(CX + 14, groinY, CX + 14, feetY, 22, "legA-r"));

  // LEGS — pose B: spread (touching circle lower-left / lower-right)
  const angLegL = Math.PI * 0.78;
  const angLegR = Math.PI * 0.22;
  const legBL = { x: CX + Math.cos(angLegL) * R, y: CY + Math.sin(angLegL) * R };
  const legBR = { x: CX + Math.cos(angLegR) * R, y: CY + Math.sin(angLegR) * R };
  fig.push(...linePoints(CX - 14, groinY, legBL.x, legBL.y, 22, "legB-l"));
  fig.push(...linePoints(CX + 14, groinY, legBR.x, legBR.y, 22, "legB-r"));

  // Centerline (subtle vertical guide)
  fig.push(...linePoints(CX, headTop + headR * 2, CX, feetY, 18, "spine"));

  return {
    frame,
    figure: fig,
    navel: { x: CX, y: navelY, key: "navel" },
  };
}

export function DottedVitruvian({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const { frame, figure, navel } = useMemo(buildPoints, []);

  const dot = (p: Pt, opts: { r: number; opacity: number; delay: number; fill?: string }) => {
    if (reduce) {
      return <circle key={p.key} cx={p.x} cy={p.y} r={opts.r} fill={opts.fill ?? "currentColor"} opacity={opts.opacity} />;
    }
    return (
      <motion.circle
        key={p.key}
        cx={p.x}
        cy={p.y}
        r={opts.r}
        fill={opts.fill ?? "currentColor"}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: opts.opacity, scale: 1 }}
        transition={{ delay: opts.delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    );
  };

  return (
    <svg
      viewBox="0 0 400 460"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vitruvian figure rendered as a point cloud"
    >
      <g className="text-foreground">
        {/* Frame: circle + square — drawn dimmer */}
        {frame.map((p, i) =>
          dot(p, { r: 1.1, opacity: 0.35, delay: 0.3 + i * 0.003 })
        )}
        {/* Figure dots */}
        {figure.map((p, i) =>
          dot(p, { r: 1.3, opacity: 0.85, delay: 0.6 + i * 0.0025 })
        )}
        {/* Navel — yellow brand dot */}
        {dot(navel, { r: 3.5, opacity: 1, delay: 1.6, fill: "hsl(var(--accent))" })}
      </g>
    </svg>
  );
}

export default DottedVitruvian;
