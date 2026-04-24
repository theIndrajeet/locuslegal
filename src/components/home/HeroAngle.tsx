import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeroAngleData = {
  id: "indictment" | "promise" | "alternative";
  eyebrow: string;
  /** Single-line punchline that morphs via GooeyText in the parent. */
  morphLine: string;
  subheadline?: string;
  primaryCta: { label: string; href?: string; scrollTo?: string };
  secondaryCta: { label: string; href: string };
};

type Props = {
  angle: HeroAngleData;
  onCtaFocusChange?: (focused: boolean) => void;
};

/**
 * Renders the per-angle bits that crossfade: eyebrow, subheadline, CTAs.
 * The fixed anchor headline + the morphing punchline live in RotatingHero.
 */
export default function HeroAngle({ angle, onCtaFocusChange }: Props) {
  const handlePrimaryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (angle.primaryCta.scrollTo) {
      e.preventDefault();
      const el = document.getElementById(angle.primaryCta.scrollTo);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col items-start text-left">
      <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-accent mb-5">
        {angle.eyebrow}
      </p>

      {angle.subheadline ? (
        <p className="text-base md:text-lg text-foreground/70 max-w-xl mb-8 leading-relaxed">
          {angle.subheadline}
        </p>
      ) : (
        <div className="mb-8" aria-hidden />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
        <Button
          asChild
          size="lg"
          className="font-heading text-base px-7 h-12 group bg-accent text-accent-foreground border-2 border-foreground hover:bg-accent/90 shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Link
            to={angle.primaryCta.href ?? "#"}
            onClick={handlePrimaryClick}
            onFocus={() => onCtaFocusChange?.(true)}
            onBlur={() => onCtaFocusChange?.(false)}
          >
            {angle.primaryCta.label.replace(/\s*→\s*$/, "")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="font-heading text-base px-7 h-12 bg-transparent text-foreground border-2 border-foreground/40 hover:border-accent hover:text-accent hover:bg-transparent transition-colors"
        >
          <Link
            to={angle.secondaryCta.href}
            onFocus={() => onCtaFocusChange?.(true)}
            onBlur={() => onCtaFocusChange?.(false)}
          >
            {angle.secondaryCta.label}
          </Link>
        </Button>
      </div>
    </div>
  );
}
