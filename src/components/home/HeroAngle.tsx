import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeroAngleData = {
  id: "indictment" | "promise" | "alternative";
  eyebrow: string;
  /** Each entry is one line of the headline. Optional `accent` paints the line in yellow. */
  headlineLines: { text: string; accent?: boolean }[];
  subheadline?: string;
  primaryCta: { label: string; href?: string; scrollTo?: string };
  secondaryCta: { label: string; href: string };
};

type Props = {
  angle: HeroAngleData;
  onCtaFocusChange?: (focused: boolean) => void;
};

export default function HeroAngle({ angle, onCtaFocusChange }: Props) {
  const handlePrimaryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (angle.primaryCta.scrollTo) {
      e.preventDefault();
      const el = document.getElementById(angle.primaryCta.scrollTo);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="text-center">
      <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-accent mb-6">
        {angle.eyebrow}
      </p>

      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-foreground">
        {angle.headlineLines.map((line, i) => (
          <span key={i} className="block">
            <span className={line.accent ? "text-accent" : undefined}>{line.text}</span>
          </span>
        ))}
      </h1>

      {angle.subheadline && (
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          {angle.subheadline}
        </p>
      )}

      <div className={`flex flex-col sm:flex-row gap-4 justify-center ${angle.subheadline ? "" : "mt-10"}`}>
        <Link
          to={angle.primaryCta.href ?? "#"}
          onClick={handlePrimaryClick}
          onFocus={() => onCtaFocusChange?.(true)}
          onBlur={() => onCtaFocusChange?.(false)}
        >
          <Button
            size="lg"
            className="font-heading text-base px-8 py-4 w-full sm:w-auto group"
          >
            {angle.primaryCta.label.replace(/\s*→\s*$/, "")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <Link
          to={angle.secondaryCta.href}
          onFocus={() => onCtaFocusChange?.(true)}
          onBlur={() => onCtaFocusChange?.(false)}
        >
          <Button
            variant="neutral"
            size="lg"
            className="font-heading text-base px-8 py-4 w-full sm:w-auto border-2 hover:shadow-[0_0_0_2px_hsl(var(--accent)/0.4)] transition-shadow"
          >
            {angle.secondaryCta.label}
          </Button>
        </Link>
      </div>
    </div>
  );
}
