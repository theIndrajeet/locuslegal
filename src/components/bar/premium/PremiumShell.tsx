// PremiumShell — dark neobrutalist app shell for the four Locus+ formats.
// Layout: 220px sidebar (numbered nav 01–04) | main column.
// Main column: sticky top-bar (back + badges + points) → instr-strip → canvas → sticky submit.
import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, FilePen, Scale, MessagesSquare, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumBadge } from "./PremiumBadge";
import { PremiumChip } from "./PremiumPrimitives";
import { supabase } from "@/integrations/supabase/client";

export type PremiumNavKey =
  | "document_review"
  | "brief_builder"
  | "ethics"
  | "client_counseling";

const NAV_ORDER: { key: PremiumNavKey; label: string; icon: typeof FileText }[] = [
  { key: "document_review", label: "Document Review", icon: FileText },
  { key: "brief_builder", label: "Brief Builder", icon: FilePen },
  { key: "ethics", label: "Ethics Dilemma", icon: Scale },
  { key: "client_counseling", label: "Client Counseling", icon: MessagesSquare },
];

export interface PremiumShellProps {
  /** Active nav key (drives sidebar highlight). */
  activeKey?: PremiumNavKey;
  formatLabel: string;
  areaLabel: string;
  difficulty: "easy" | "medium" | "hard";
  /** e.g. "25" — number only; "PTS" rendered as suffix. */
  pointsLabel: string;
  title: string;
  /** Short intro line shown in the instruction strip. */
  prompt?: string;
  /** Italic citation under the title. */
  sourceLine?: string;
  /** Right-aligned amber chip in instruction strip (e.g. "3 FLAGGED", "STEP 2/4"). */
  counter?: string;
  /** Footer left meta — e.g. "5 errors found" or "Saved · just now". */
  metaLeft?: ReactNode;
  /** Footer primary CTA. */
  cta?: ReactNode;
  backHref?: string;
  children: ReactNode;
}

export function PremiumShell({
  activeKey,
  formatLabel,
  areaLabel,
  difficulty,
  pointsLabel,
  title,
  prompt,
  sourceLine,
  counter,
  metaLeft,
  cta,
  backHref = "/the-bar",
  children,
}: PremiumShellProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", uid)
        .maybeSingle();
      if (!active) return;
      setDisplayName(prof?.display_name ?? prof?.username ?? null);
    });
    return () => { active = false; };
  }, []);

  const diffTone =
    difficulty === "easy" ? "good" : difficulty === "hard" ? "bad" : "accent";

  // Pick a numeric value vs. suffix from "25 pts" / "25"
  const ptsParts = pointsLabel.trim().split(/\s+/);
  const ptsNum = ptsParts[0] ?? pointsLabel;
  const ptsSuffix = ptsParts.length > 1 ? ptsParts.slice(1).join(" ") : "PTS";

  return (
    <div className="locus-plus min-h-screen pt-16">
      <div className="grid lg:grid-cols-[220px_1fr] min-h-[calc(100vh-4rem)]">
        {/* ─────────── Sidebar ─────────── */}
        <aside className="hidden lg:flex flex-col gap-7 sticky top-16 h-[calc(100vh-4rem)] border-r-2 border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-[18px] py-6">
          <Link to="/" className="flex items-baseline gap-1.5 group">
            <span
              className="text-[22px] font-extrabold tracking-[-0.04em] leading-none text-[hsl(var(--lp-text))]"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              locus.
            </span>
            <span className="inline-block w-[6px] h-[6px] bg-[hsl(var(--lp-accent))] rounded-[1px]" />
          </Link>
          <div
            className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--lp-text-3))] -mt-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The Bar · Research Preview
          </div>

          <nav className="flex flex-col gap-1">
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--lp-text-3))] mb-2 pl-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Formats
            </div>
            {NAV_ORDER.map((item, i) => {
              const isActive = item.key === activeKey;
              const num = String(i + 1).padStart(2, "0");
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 border-2 rounded-[4px] text-[13.5px] font-medium transition-colors",
                    isActive
                      ? "border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg-1))] text-[hsl(var(--lp-text))]"
                      : "border-transparent text-[hsl(var(--lp-text-2))]",
                  )}
                >
                  <span
                    className={cn(
                      "w-[18px] text-[10.5px]",
                      isActive ? "text-[hsl(var(--lp-accent))]" : "text-[hsl(var(--lp-text-3))]",
                    )}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {num}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto border-t-2 border-[hsl(var(--lp-line))] pt-4 space-y-2">
            <div
              className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--lp-text-3))]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Session
            </div>
            <div className="text-[13px] text-[hsl(var(--lp-text))] truncate font-medium">
              {displayName ?? "Guest"}
            </div>
            <div
              className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--lp-accent))]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Flame size={11} />
              ON THE BAR
            </div>
          </div>
        </aside>

        {/* ─────────── Main column ─────────── */}
        <div className="flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b-2 border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-5 md:px-8 py-[18px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <Link
                to={backHref}
                aria-label="Back"
                className="grid place-items-center w-[34px] h-[34px] border-2 border-[hsl(var(--lp-line))] rounded-[4px] text-[hsl(var(--lp-text-2))] hover:text-[hsl(var(--lp-text))] hover:border-[hsl(var(--lp-line-2))] hover:bg-[hsl(var(--lp-bg-1))] transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </Link>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <PremiumChip>{formatLabel}</PremiumChip>
                <PremiumChip>{areaLabel}</PremiumChip>
                <PremiumChip tone={diffTone}>{difficulty}</PremiumChip>
                <PremiumBadge size="sm" />
              </div>
            </div>
            <div
              className="hidden sm:flex items-baseline gap-1.5 text-[12px] tracking-[0.04em] text-[hsl(var(--lp-text-2))] shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-[hsl(var(--lp-accent))] font-semibold text-[15px]">{ptsNum}</span>
              <span className="text-[10.5px] uppercase tracking-[0.14em]">{ptsSuffix}</span>
            </div>
          </header>

          {/* Title strip */}
          <div className="px-5 md:px-8 py-5 border-b-2 border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] space-y-1">
            <h1
              className="text-[22px] md:text-[26px] leading-[1.15] tracking-[-0.02em] text-[hsl(var(--lp-text))]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {title}
            </h1>
            {sourceLine && (
              <p
                className="text-[13px] italic text-[hsl(var(--lp-text-3))]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {sourceLine}
              </p>
            )}
          </div>

          {/* Instruction strip */}
          {(prompt || counter) && (
            <div className="flex items-center justify-between gap-4 px-5 md:px-8 py-3.5 border-b-2 border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))]">
              {prompt ? (
                <p className="text-[13.5px] text-[hsl(var(--lp-text-2))] leading-relaxed">
                  {prompt}
                </p>
              ) : (
                <span />
              )}
              {counter && <PremiumChip tone="accent">{counter}</PremiumChip>}
            </div>
          )}

          {/* Canvas */}
          <main className="flex-1 px-5 md:px-8 py-7 pb-[120px] lp-scroll bg-[hsl(var(--lp-bg))] min-w-0">
            {children}
          </main>

          {/* Sticky submit */}
          {(metaLeft || cta) && (
            <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t-2 border-[hsl(var(--lp-line))] bg-[hsl(0_0%_0%/0.92)] backdrop-blur px-5 md:px-8 py-3.5">
              <div
                className="text-[12px] text-[hsl(var(--lp-text-2))] truncate"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {metaLeft ?? <span className="text-[hsl(var(--lp-text-3))]">Locus+ · Premium track</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">{cta}</div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
