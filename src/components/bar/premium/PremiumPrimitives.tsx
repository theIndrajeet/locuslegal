// Small primitives reused across the four Locus+ renderers.
import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PremiumCard({
  children,
  className,
  flat,
}: {
  children: ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return (
    <div className={cn(flat ? "premium-paper-flat" : "premium-paper", "p-5 md:p-6", className)}>
      {children}
    </div>
  );
}

export function PremiumLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--premium-muted))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PremiumChip({
  children,
  active,
  done,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  done?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-[hsl(var(--premium-ink))] bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))]"
          : done
            ? "border-[hsl(var(--premium-border))] bg-[hsl(var(--premium-accent-tint))] text-[hsl(var(--premium-ink))]"
            : "border-[hsl(var(--premium-border))] bg-white text-[hsl(var(--premium-muted))]",
        className,
      )}
    >
      {children}
    </span>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function PremiumButton({ variant = "primary", className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium",
        "transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))] hover:bg-[hsl(0_0%_18%)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        variant === "secondary" &&
          "border border-[hsl(var(--premium-border))] bg-white text-[hsl(var(--premium-ink))] hover:border-[hsl(var(--premium-border-strong))]",
        variant === "ghost" &&
          "text-[hsl(var(--premium-muted))] hover:text-[hsl(var(--premium-ink))]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PremiumDivider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-[hsl(var(--premium-border))]", className)} />;
}
