/**
 * ShapeLandingBg — quiet floating geometric shapes for hero backgrounds.
 * Restyled from kokonutui's shape-landing-hero into our strict Black/White/Yellow palette.
 * Pointer-events-none, aria-hidden — purely decorative.
 */
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShapeProps = {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
};

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: ShapeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: -120, rotate: rotate - 12 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: reduceMotion ? 0 : 2.2,
        delay: reduceMotion ? 0 : delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: reduceMotion ? 0 : 1.1 },
      }}
      className={cn("absolute", className)}
      style={{ width, height }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { y: [0, 14, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 12, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ width, height }}
        className={cn(
          "relative rounded-full",
          "bg-gradient-to-r to-transparent",
          gradient,
          "backdrop-blur-[2px] border-2 border-white/[0.08]",
          "shadow-[0_8px_32px_0_rgba(255,255,255,0.04)]",
          "after:absolute after:inset-0 after:rounded-full",
          "after:bg-[radial-gradient(circle_at_50%_50%,hsl(var(--foreground)/0.08),transparent_70%)]"
        )}
      />
    </motion.div>
  );
}

export default function ShapeLandingBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* subtle global tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-white/[0.03] blur-3xl" />

      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={-8}
        gradient="from-white/[0.10]"
        className="left-[-10%] md:left-[-6%] top-[14%] md:top-[18%]"
      />
      <ElegantShape
        delay={0.5}
        width={500}
        height={120}
        rotate={15}
        gradient="from-accent/[0.16]"
        className="right-[-6%] md:right-[-4%] top-[68%] md:top-[72%]"
      />
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-20}
        gradient="from-white/[0.10]"
        className="left-[4%] md:left-[6%] bottom-[6%] md:bottom-[10%]"
      />
      <ElegantShape
        delay={0.6}
        width={200}
        height={60}
        rotate={25}
        gradient="from-accent/[0.16]"
        className="right-[12%] md:right-[16%] top-[8%] md:top-[10%]"
      />
      <ElegantShape
        delay={0.7}
        width={150}
        height={40}
        rotate={-25}
        gradient="from-white/[0.10]"
        className="left-[18%] md:left-[22%] top-[4%] md:top-[6%]"
      />
    </div>
  );
}
