import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from "framer-motion";
import { type ReactNode, type ElementType } from "react";

type TimelineContentProps = {
  children: ReactNode;
  as?: ElementType;
  index?: number;
  variants?: Variants;
  className?: string;
  once?: boolean;
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "custom">;

export const revealVariants: Variants = {
  hidden: { filter: "blur(10px)", y: 30, opacity: 0 },
  visible: (i: number = 0) => ({
    filter: "blur(0px)",
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const textVariants: Variants = {
  hidden: { filter: "blur(8px)", y: 18, opacity: 0 },
  visible: (i: number = 0) => ({
    filter: "blur(0px)",
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function TimelineContent({
  children,
  as,
  index = 0,
  variants = revealVariants,
  className,
  once = true,
  amount = 0.2,
  ...rest
}: TimelineContentProps) {
  const reduce = useReducedMotion();
  const Comp = motion(as ?? "div");

  if (reduce) {
    const Static = (as ?? "div") as ElementType;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      {...rest}
    >
      {children}
    </Comp>
  );
}
