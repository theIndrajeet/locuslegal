import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "cell" | "strip";
}

const POPULAR: Array<{ label: string; query: string }> = [
  { label: "Tier 1", query: "tier=Tier+1" },
  { label: "Mumbai", query: "city=Mumbai" },
  { label: "IP", query: "area=IP" },
];

export default function DirectoryTeaser({ variant = "cell" }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    navigate(`/directory${params.toString() ? `?${params}` : ""}`);
  };

  if (variant === "strip") {
    return (
      <div className="relative bg-card border-2 border-foreground/80 rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_0_hsl(var(--accent))] hover:shadow-[6px_6px_0_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-start gap-3 md:flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/15 border-2 border-foreground/70 flex items-center justify-center">
              <Building2 size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-0.5">Directory</p>
              <h3 className="font-heading text-base md:text-lg font-extrabold tracking-tight leading-tight">
                Can't find a fit? <span className="text-accent">Search 500+ firms.</span>
              </h3>
            </div>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 md:flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value.slice(0, 80))}
                placeholder="Search firms by name…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border-2 border-foreground/30 focus:border-foreground/80 outline-none text-sm font-medium placeholder:text-muted-foreground transition-colors"
              />
            </div>
            <button
              type="submit"
              aria-label="Search directory"
              className="shrink-0 h-10 px-3 rounded-lg bg-accent text-accent-foreground font-bold border-2 border-foreground/80 shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center"
            >
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // cell variant — fits a vacancy grid cell
  return (
    <div className="relative bg-card border-2 border-foreground/80 rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_0_hsl(var(--accent))] hover:shadow-[6px_6px_0_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-all flex flex-col">
      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 border-2 border-foreground/70 flex items-center justify-center">
          <Building2 size={14} className="text-accent" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Directory</span>
      </div>

      {/* Headline */}
      <h3 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight leading-tight mb-1">
        Can't find a fit?
      </h3>
      <p className="font-heading text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-accent mb-4">
        Search 500+ firms.
      </p>

      {/* Search */}
      <form onSubmit={submit} className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 80))}
            placeholder="Search firms by name…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border-2 border-foreground/30 focus:border-foreground/80 outline-none text-sm font-medium placeholder:text-muted-foreground transition-colors"
          />
        </div>
        <button
          type="submit"
          aria-label="Search directory"
          className="shrink-0 h-10 px-3 rounded-lg bg-accent text-accent-foreground font-bold border-2 border-foreground/80 shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center"
        >
          <ArrowRight size={16} />
        </button>
      </form>

      {/* Popular chips */}
      <div className="flex items-center gap-2 flex-wrap mb-auto">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Popular</span>
        {POPULAR.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => navigate(`/directory?${p.query}`)}
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border-2 border-foreground/40 bg-background",
              "hover:border-foreground/80 hover:bg-accent/10 transition-colors",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Footer link */}
      <button
        type="button"
        onClick={() => navigate("/directory")}
        className="mt-4 pt-3 border-t border-border/50 text-sm font-semibold text-foreground/80 hover:text-accent inline-flex items-center justify-between gap-2 group"
      >
        <span>Browse the full directory</span>
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
