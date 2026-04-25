/**
 * ShapeLandingBg — quiet floating geometric shapes for hero backgrounds.
 *
 * Pure CSS animation (entry transition + infinite float keyframes). Previously
 * used framer-motion which dragged ~60 KB into the home critical bundle.
 * Pointer-events-none, aria-hidden — purely decorative.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ShapeProps = {
  className?: string;
  delayMs?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  visible: boolean;
};

function ElegantShape({
  className,
  delayMs = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  visible,
}: ShapeProps) {
  // Entry: opacity 0 + translateY(-120px) + rotate(rotate-12) → settled.
  const entryStyle: CSSProperties = {
    width,
    height,
    transitionProperty: "opacity, transform",
    transitionDuration: "2.2s, 1.1s",
    transitionTimingFunction: "cubic-bezier(0.23, 0.86, 0.39, 0.96)",
    transitionDelay: `${delayMs}ms`,
    opacity: visible ? 1 : 0,
    transform: visible
      ? `translate3d(0,0,0) rotate(${rotate}deg)`
      : `translate3d(0,-120px,0) rotate(${rotate - 12}deg)`,
  };

  const floatStyle: CSSProperties = {
    width,
    height,
    animation: visible ? "shapeFloat 12s ease-in-out infinite" : undefined,
    animationDelay: `${delayMs + 2200}ms`,
  };

  return (
    <div className={cn("absolute", className)} style={entryStyle}>
      <div
        style={floatStyle}
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
    </div>
  );
}

export default function ShapeLandingBg() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Honor reduced motion: skip the entry animation entirely (snap visible).
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    // rAF so the initial state paints first, then we transition in.
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* subtle global tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-white/[0.03] blur-3xl" />

      <ElegantShape
        delayMs={300}
        width={600}
        height={140}
        rotate={-8}
        gradient="from-white/[0.10]"
        className="left-[-10%] md:left-[-6%] top-[14%] md:top-[18%]"
        visible={visible}
      />
      <ElegantShape
        delayMs={500}
        width={500}
        height={120}
        rotate={15}
        gradient="from-accent/[0.16]"
        className="right-[-6%] md:right-[-4%] top-[68%] md:top-[72%]"
        visible={visible}
      />
      <ElegantShape
        delayMs={400}
        width={300}
        height={80}
        rotate={-20}
        gradient="from-white/[0.10]"
        className="left-[4%] md:left-[6%] bottom-[6%] md:bottom-[10%]"
        visible={visible}
      />
      <ElegantShape
        delayMs={600}
        width={200}
        height={60}
        rotate={25}
        gradient="from-accent/[0.16]"
        className="right-[12%] md:right-[16%] top-[8%] md:top-[10%]"
        visible={visible}
      />
      <ElegantShape
        delayMs={700}
        width={150}
        height={40}
        rotate={-25}
        gradient="from-white/[0.10]"
        className="left-[18%] md:left-[22%] top-[4%] md:top-[6%]"
        visible={visible}
      />
    </div>
  );
}
