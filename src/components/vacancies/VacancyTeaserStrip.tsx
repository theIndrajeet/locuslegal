import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type Vacancy, daysLeft, urgencyTone, formatExpiry } from "@/lib/vacancies";
import { useCountdown } from "@/lib/useCountdown";
import { cn } from "@/lib/utils";

function VacancyTeaserCard({ v }: { v: Vacancy }) {
  const d = daysLeft(v.expires_at);
  const tone = urgencyTone(d);
  const { label, expired } = useCountdown(v.expires_at);
  return (
    <Link
      to={`/vacancies#vacancy-${v.id}`}
      className={cn(
        "snap-start shrink-0 w-[260px] md:w-[280px] bg-background border-2 rounded-xl p-3 transition-all",
        tone === "soon"
          ? "border-foreground/60"
          : "border-foreground/80 hover:shadow-[3px_3px_0_0_hsl(var(--accent))]",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-heading text-sm font-extrabold leading-tight truncate flex-1">
          {v.firm_name}
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap tabular-nums",
            expired
              ? "bg-muted text-muted-foreground border-foreground/40"
              : tone === "soon"
                ? "bg-muted text-foreground border-foreground/60"
                : "bg-accent text-accent-foreground border-foreground/70",
          )}
        >
          {tone === "soon" ? <AlertTriangle size={9} /> : <Clock size={9} />}
          {label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{v.role}</p>
      {v.location && (
        <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">{v.location}</p>
      )}
    </Link>
  );
}

export default function VacancyTeaserStrip() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("vacancies")
        .select("*")
        .eq("status", "live")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .limit(8);
      if (cancelled) return;
      setVacancies((data ?? []) as Vacancy[]);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded || vacancies.length === 0) return null;

  const scroll = (dir: "l" | "r") => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "l" ? -w : w, behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-4 md:px-8 mb-6">
      <div className="bg-card/60 backdrop-blur-sm border-2 border-foreground/70 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0_0_hsl(var(--accent))]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 shrink-0">
              <Briefcase size={16} className="text-accent" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-sm md:text-base font-extrabold tracking-tight">
                Live Vacancies
                <span className="ml-2 text-xs font-bold text-accent">({vacancies.length})</span>
              </h2>
              <p className="text-[11px] md:text-xs text-muted-foreground hidden sm:block">
                Curated openings · expires when the deadline closes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => scroll("l")}
              aria-label="Scroll left"
              className="hidden md:inline-flex w-8 h-8 items-center justify-center rounded-full border border-border hover:border-accent/60 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scroll("r")}
              aria-label="Scroll right"
              className="hidden md:inline-flex w-8 h-8 items-center justify-center rounded-full border border-border hover:border-accent/60 transition"
            >
              <ChevronRight size={14} />
            </button>
            <Link
              to="/vacancies"
              className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1 ml-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {vacancies.map((v) => {
            const d = daysLeft(v.expires_at);
            const tone = urgencyTone(d);
            return (
              <Link
                key={v.id}
                to={`/vacancies#vacancy-${v.id}`}
                className={cn(
                  "snap-start shrink-0 w-[260px] md:w-[280px] bg-background border-2 rounded-xl p-3 transition-all",
                  tone === "soon"
                    ? "border-foreground/60"
                    : "border-foreground/80 hover:shadow-[3px_3px_0_0_hsl(var(--accent))]",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-heading text-sm font-extrabold leading-tight truncate flex-1">
                    {v.firm_name}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0",
                      tone === "soon"
                        ? "bg-muted text-foreground border-foreground/60"
                        : "bg-accent text-accent-foreground border-foreground/70",
                    )}
                  >
                    {tone === "soon" ? <AlertTriangle size={9} /> : <Clock size={9} />}
                    {d}d
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{v.role}</p>
                {v.location && (
                  <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">{v.location}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
