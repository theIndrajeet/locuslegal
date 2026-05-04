import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Building2,
  FileText,
  Gavel,
  Trophy,
  MapPin,
  Calendar,
  Coins,
  GraduationCap,
  Globe,
  ExternalLink,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  SAMPLE_DATA,
  type AnyOpportunity,
  type OpportunityStream,
  STREAM_META,
} from "@/components/opportunities-preview/sampleData";

type GroupKey = "career" | "academic" | "contests";

const GROUPS: Array<{
  key: GroupKey;
  label: string;
  streams: OpportunityStream[];
}> = [
  { key: "career", label: "Career", streams: ["internship", "job"] },
  { key: "academic", label: "Academic", streams: ["cfp", "moot"] },
  { key: "contests", label: "Contests", streams: ["competition"] },
];

function streamLabel(s: OpportunityStream): string {
  if (s === "cfp") return "CFPs";
  if (s === "internship") return "Internships";
  if (s === "job") return "Jobs";
  if (s === "moot") return "Moots";
  return "Competitions";
}

function countdown(iso: string): { label: string; tone: "ok" | "soon" | "expired" } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { label: "Closed", tone: "expired" };
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days >= 7) return { label: `${days}d left`, tone: "ok" };
  if (days >= 1) return { label: `${days}d ${hours}h left`, tone: "soon" };
  return { label: `${hours}h left`, tone: "soon" };
}

export default function OpportunitiesPreview() {
  usePageMeta({
    title: "Opportunities — Preview",
    description: "Visual preview of the v2 opportunities board.",
  });

  const [activeGroup, setActiveGroup] = useState<GroupKey>("career");
  const [filter, setFilter] = useState<OpportunityStream | null>(null);
  const [selected, setSelected] = useState<AnyOpportunity | null>(null);

  const currentGroup = GROUPS.find((g) => g.key === activeGroup)!;
  const activeStreams: OpportunityStream[] = filter
    ? [filter]
    : currentGroup.streams;

  const items = useMemo(() => {
    const sorted = [...SAMPLE_DATA].sort(
      (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
    );
    return sorted.filter((i) => activeStreams.includes(i.stream));
  }, [activeStreams]);

  const liveCount = SAMPLE_DATA.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="bg-foreground text-background border-b-2 border-foreground">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            Demo mode — visual preview only. Nothing here is real or persists.
          </span>
          <Link
            to="/vacancies"
            className="hidden md:inline-flex items-center gap-1 text-accent hover:underline"
          >
            <ArrowLeft size={12} /> Back to live board
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <header className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Opportunit<span className="text-accent">ies</span>
          </h1>
          <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl">
            Internships, jobs, calls for papers, moots, and competitions —
            curated, in one place. {liveCount} live right now.
          </p>
        </header>

        {/* Two-tier nav: top groups, bottom sub-streams */}
        <div className="sticky top-0 z-10 bg-background -mx-1 px-1 pt-2 pb-3 mb-6 space-y-3">
          <div className="flex flex-wrap justify-center gap-2 border-b-2 border-foreground/15 pb-3">
            {GROUPS.map((g) => {
              const active = activeGroup === g.key;
              const groupCount = SAMPLE_DATA.filter((i) => g.streams.includes(i.stream)).length;
              return (
                <button
                  key={g.key}
                  onClick={() => { setActiveGroup(g.key); setFilter(null); }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold uppercase tracking-wider transition-all",
                    active
                      ? "border-foreground bg-foreground text-background shadow-[3px_3px_0_0_hsl(var(--accent))]"
                      : "border-foreground/70 bg-background text-foreground hover:bg-muted shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--foreground))]",
                  )}
                >
                  {g.label}
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-mono", active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground")}>
                    {groupCount}
                  </span>
                </button>
              );
            })}
          </div>

          {currentGroup.streams.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all",
                  filter === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/40 bg-background text-foreground hover:bg-muted",
                )}
              >
                All {currentGroup.label}
              </button>
              {currentGroup.streams.map((s) => {
                const active = filter === s;
                const Icon = STREAM_META[s].icon;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/40 bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon size={12} />
                    {streamLabel(s)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {items.map((item) => (
            <OpportunityCard key={item.id} item={item} onClick={() => setSelected(item)} />
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Nothing in this stream right now.
          </div>
        )}
      </div>

      <DetailDialog item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ---------------- Card ---------------- */

function OpportunityCard({
  item,
  onClick,
}: {
  item: AnyOpportunity;
  onClick: () => void;
}) {
  const meta = STREAM_META[item.stream];
  const Icon = meta.icon;
  const deadline = "deadline" in item ? item.deadline : item.expires_at;
  const cd = countdown(deadline);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left bg-card border-2 border-foreground/80 rounded-2xl p-5 transition-all overflow-hidden",
        "shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:-translate-y-0.5",
      )}
    >
      {/* Accent strip */}
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 w-1.5", meta.accentBg)}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border-2 border-foreground/80 mb-2",
              meta.pillBg,
              meta.pillText,
            )}
          >
            <Icon size={10} />
            {meta.pillLabel}
          </span>
          <h3 className="font-heading text-lg md:text-xl font-extrabold tracking-tight text-foreground leading-tight">
            {titleOf(item)}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {organiserOf(item)}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-foreground/70",
            cd.tone === "expired"
              ? "bg-muted text-muted-foreground"
              : cd.tone === "soon"
                ? "bg-background text-foreground"
                : "bg-accent text-accent-foreground",
          )}
        >
          {cd.tone === "soon" ? <AlertTriangle size={12} /> : <Clock size={12} />}
          {cd.label}
        </span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {metaChips(item).map((chip, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <chip.icon size={12} />
            {chip.label}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Source: {item.source_credit}
        </span>
        <span className="text-xs font-bold text-accent inline-flex items-center gap-1 group-hover:underline">
          View details <ExternalLink size={12} />
        </span>
      </div>
    </button>
  );
}

function titleOf(i: AnyOpportunity): string {
  switch (i.stream) {
    case "internship":
    case "job":
      return `${i.role} — ${i.firm_name}`;
    case "cfp":
      return i.publication_name;
    case "moot":
      return i.competition_name;
    case "competition":
      return i.title;
  }
}

function organiserOf(i: AnyOpportunity): string {
  switch (i.stream) {
    case "internship":
    case "job":
      return i.location || "Location TBD";
    case "cfp":
      return `${i.publication_type === "journal" ? "Journal" : i.publication_type === "blog" ? "Blog" : "Publication"} · ${i.peer_reviewed ? "Peer-reviewed" : "Editorial review"}`;
    case "moot":
      return `${i.organiser} · ${i.edition ?? "—"}`;
    case "competition":
      return i.organiser;
  }
}

function metaChips(i: AnyOpportunity) {
  switch (i.stream) {
    case "internship":
    case "job":
      return [
        i.stipend && { icon: Coins, label: i.stipend },
        i.eligibility && { icon: GraduationCap, label: i.eligibility },
      ].filter(Boolean) as { icon: any; label: string }[];
    case "cfp":
      return [
        { icon: FileText, label: `${i.word_limit_min ?? "—"}–${i.word_limit_max ?? "—"} words` },
        { icon: Coins, label: i.submission_fee },
      ];
    case "moot":
      return [
        { icon: Globe, label: i.mode },
        { icon: MapPin, label: i.venue ?? "Online" },
        { icon: Trophy, label: i.prize_pool },
      ];
    case "competition":
      return [
        { icon: Trophy, label: i.prize_or_stipend },
        { icon: Globe, label: i.mode },
        { icon: Coins, label: i.fee },
      ];
  }
}

/* ---------------- Detail dialog ---------------- */

function DetailDialog({
  item,
  onClose,
}: {
  item: AnyOpportunity | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <span
                className={cn(
                  "self-start inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border-2 border-foreground/80 mb-2",
                  STREAM_META[item.stream].pillBg,
                  STREAM_META[item.stream].pillText,
                )}
              >
                {STREAM_META[item.stream].pillLabel}
              </span>
              <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                {titleOf(item)}
              </DialogTitle>
              <DialogDescription className="text-sm">{organiserOf(item)}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <DetailFields item={item} />

              {item.description && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    About
                  </h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={(e) => e.preventDefault()}
                      className="font-bold border-2 border-foreground/80 shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))]"
                    >
                      {ctaLabel(item)} <ExternalLink size={14} className="ml-1.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Demo only — buttons are inert</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ctaLabel(i: AnyOpportunity): string {
  if (i.stream === "internship" || i.stream === "job") return "Draft application";
  if (i.stream === "cfp") return "Submit paper";
  if (i.stream === "moot") return "Register team";
  return "Apply now";
}

function DetailFields({ item }: { item: AnyOpportunity }) {
  const rows: Array<[string, string]> = [];
  switch (item.stream) {
    case "internship":
    case "job":
      if (item.location) rows.push(["Location", item.location]);
      if (item.stipend) rows.push(["Stipend", item.stipend]);
      if (item.eligibility) rows.push(["Eligibility", item.eligibility]);
      rows.push(["Deadline", new Date(item.expires_at).toLocaleDateString()]);
      rows.push(["Apply via", item.application_email]);
      break;
    case "cfp":
      if (item.theme) rows.push(["Theme", item.theme]);
      rows.push(["Deadline", new Date(item.deadline).toLocaleDateString()]);
      rows.push(["Word limit", `${item.word_limit_min ?? "—"}–${item.word_limit_max ?? "—"}`]);
      rows.push(["Co-authorship", item.co_authorship_allowed ? "Allowed" : "Single author"]);
      rows.push(["Submission fee", item.submission_fee]);
      rows.push(["Review", item.peer_reviewed ? "Peer-reviewed" : "Editorial"]);
      rows.push(["Submit to", item.submission_url ?? item.submission_email ?? "—"]);
      break;
    case "moot":
      rows.push(["Mode", item.mode]);
      if (item.venue) rows.push(["Venue", item.venue]);
      rows.push(["Event dates", `${item.event_start_date} → ${item.event_end_date}`]);
      rows.push(["Registration deadline", new Date(item.deadline).toLocaleDateString()]);
      if (item.memorial_deadline) rows.push(["Memorial deadline", new Date(item.memorial_deadline).toLocaleDateString()]);
      rows.push(["Team size", `${item.team_size_min}–${item.team_size_max}`]);
      rows.push(["Registration fee", item.registration_fee]);
      rows.push(["Prize pool", item.prize_pool]);
      rows.push(["Area of law", item.area_of_law]);
      if (item.eligibility) rows.push(["Eligibility", item.eligibility]);
      break;
    case "competition":
      rows.push(["Category", item.category]);
      rows.push(["Mode", item.mode]);
      rows.push(["Deadline", new Date(item.deadline).toLocaleDateString()]);
      if (item.event_date) rows.push(["Event date", item.event_date]);
      rows.push(["Prize / stipend", item.prize_or_stipend]);
      rows.push(["Fee", item.fee]);
      if (item.eligibility) rows.push(["Eligibility", item.eligibility]);
      rows.push(["Apply via", item.application_url ?? item.contact_email ?? "—"]);
      break;
  }

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col">
          <dt className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            {k}
          </dt>
          <dd className="text-foreground font-medium break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
