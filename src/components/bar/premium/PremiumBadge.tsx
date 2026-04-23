// Locus+ pill — used on cards, preview tiles and the shell header.
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md";
}

export function PremiumBadge({ className, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-white",
        "font-medium tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        // Force premium-look colors even when used outside .locus-plus scope (e.g. on cards).
        "border-[hsl(39_22%_82%)] text-[hsl(0_0%_10%)]",
        className,
      )}
      aria-label="Locus Plus premium format"
    >
      <span
        className={cn(
          "inline-block rounded-full bg-[hsl(45_100%_51%)]",
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
        )}
      />
      Locus+
    </span>
  );
}
