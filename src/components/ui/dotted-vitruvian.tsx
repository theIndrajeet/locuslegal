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
      className={`relative overflow-hidden ${className ?? ""}`}
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

      {/* Dotted layer — same image, masked with a radial-dot pattern for halftone effect.
          Animates: (1) opacity breathing + (2) mask-position drift = live "rendering" feel. */}
      <motion.img
        src={vitruvianSrc}
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        className="relative w-full h-full object-contain mix-blend-screen pointer-events-none select-none"
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
        animate={
          reduce
            ? { opacity: 0.9 }
            : {
                opacity: [0.85, 1, 0.85],
                maskPosition: ["0px 0px", "2.5px 2.5px", "0px 0px"],
              }
        }
        transition={
          reduce
            ? undefined
            : {
                opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                maskPosition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }
        }
      />

      {/* Scanline shimmer — soft horizontal bar drifting top→bottom for "live render" feel */}
      {!reduce && (
        <motion.div
          className="absolute inset-x-0 h-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, hsl(0 0% 100% / 0.05) 50%, transparent 100%)",
            mixBlendMode: "screen",
          }}
          initial={{ top: "-10%" }}
          animate={{ top: ["−10%", "110%"] as unknown as string[] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      )}

      {/* Yellow navel dot — brand pop at the figure's geometric center, soft pulse */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: "hsl(var(--accent))" }}
        animate={
          reduce
            ? { boxShadow: "0 0 12px hsl(var(--accent) / 0.7)" }
            : {
                boxShadow: [
                  "0 0 12px hsl(var(--accent) / 0.6)",
                  "0 0 22px hsl(var(--accent) / 0.95)",
                  "0 0 12px hsl(var(--accent) / 0.6)",
                ],
              }
        }
        transition={reduce ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
    </motion.div>
  );
}

export default DottedVitruvian;
