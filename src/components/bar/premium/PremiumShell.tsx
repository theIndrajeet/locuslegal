// PremiumShell — paper canvas for the four Locus+ formats.
// Wraps everything in `.locus-plus` so premium tokens & serif typography apply.
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumBadge } from "./PremiumBadge";

export interface PremiumShellProps {
  formatLabel: string;
  areaLabel: string;
  difficulty: "easy" | "medium" | "hard";
  pointsLabel: string; // e.g. "25 pts"
  title: string;
  prompt?: string;
  sourceLine?: string;
  matterContext?: string;
  autosaveLabel?: string; // e.g. "Saved · just now"
  backHref?: string;
  cta?: ReactNode;
  children: ReactNode;
}

export function PremiumShell({
  formatLabel,
  areaLabel,
  difficulty,
  pointsLabel,
  title,
  prompt,
  sourceLine,
  matterContext,
  autosaveLabel,
  backHref = "/the-bar",
  cta,
  children,
}: PremiumShellProps) {
  return (
    <div className="locus-plus min-h-screen">
      <div className="mx-auto max-w-[980px] px-4 md:px-8 py-6 md:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to={backHref}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm",
              "text-[hsl(var(--premium-muted))] hover:text-[hsl(var(--premium-ink))] transition-colors",
            )}
          >
            <ChevronLeft size={15} /> Back
          </Link>
          <PremiumBadge />
        </div>

        {/* Title block */}
        <header className="mb-5 md:mb-7">
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em]",
              "text-[hsl(var(--premium-muted))] mb-3",
            )}
          >
            <span className="font-medium">{formatLabel}</span>
            <Dot />
            <span>{areaLabel}</span>
            <Dot />
            <span className="capitalize">{difficulty}</span>
            <Dot />
            <span className="text-[hsl(var(--premium-ink))] font-medium">{pointsLabel}</span>
          </div>
          <h1 className="text-3xl md:text-[40px] leading-[1.1] tracking-tight text-[hsl(var(--premium-ink))]">
            {title}
          </h1>
          {prompt && (
            <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--premium-muted))] max-w-[68ch]">
              {prompt}
            </p>
          )}
          {sourceLine && (
            <p className="mt-2 text-[12px] italic text-[hsl(var(--premium-subtle))]">{sourceLine}</p>
          )}
        </header>

        {/* Body slot */}
        <main className="space-y-5 premium-fade-in">{children}</main>

        {/* Footer */}
        <footer className="mt-8 pt-5 border-t border-[hsl(var(--premium-border))] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--premium-muted))]">
            {autosaveLabel ? (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--premium-success))] premium-pulse-dot" />
                <Check size={12} /> {autosaveLabel}
              </>
            ) : (
              <span>{matterContext ?? "Locus+ · Premium track"}</span>
            )}
          </div>
          {cta && <div className="flex items-center gap-2">{cta}</div>}
        </footer>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-[hsl(var(--premium-subtle))]">·</span>;
}
