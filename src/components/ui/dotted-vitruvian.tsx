import { motion, useReducedMotion } from "framer-motion";
import vitruvianSrc from "@/assets/vitruvian-figure.png";

/**
 * DottedVitruvian — Da Vinci's Vitruvian Man rendered as a point cloud.
 *
 * Uses a real white-line illustration of the Vitruvian Man, then applies
 * a CSS radial-gradient mask that punches the figure into a dotted/halftone
 * pattern. Geometry meets humanity — Locus's "merit, not pedigree" thesis.
 *
 * A single yellow dot sits at the navel (golden-ratio center) for brand pop.
 */

export function DottedVitruvian({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      role="img"
      aria-label="Vitruvian Man — geometry meets humanity"
    >
      {/* Faint underlay — keeps the figure readable even where the dot mask thins out */}
      <img
        src={vitruvianSrc}
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-contain opacity-[0.12] mix-blend-screen pointer-events-none select-none"
        draggable={false}
      />

      {/* Dotted layer — same image, masked with a radial-dot pattern for halftone effect */}
      <img
        src={vitruvianSrc}
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        className="relative w-full h-full object-contain opacity-90 mix-blend-screen pointer-events-none select-none"
        draggable={false}
        style={{
          WebkitMaskImage:
            "radial-gradient(circle, #000 1.1px, transparent 1.4px)",
          maskImage:
            "radial-gradient(circle, #000 1.1px, transparent 1.4px)",
          WebkitMaskSize: "5px 5px",
          maskSize: "5px 5px",
          WebkitMaskRepeat: "repeat",
          maskRepeat: "repeat",
        }}
      />

      {/* Yellow navel dot — brand pop at the figure's geometric center */}
      <div
        className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: "hsl(var(--accent))",
          boxShadow: "0 0 12px hsl(var(--accent) / 0.7)",
        }}
        aria-hidden
      />
    </motion.div>
  );
}

export default DottedVitruvian;
