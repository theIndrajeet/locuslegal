import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Coins,
  GraduationCap,
  Globe,
  ExternalLink,
  Clock,
  AlertTriangle,
  MapPin,
  Trophy,
  Loader2,
  Calendar,
  BadgeCheck,
  Users,
  Mail,
  Link2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import {
  STREAM_META,
  streamLabel,
  countdown,
  titleOf,
  organiserOf,
  prettify,
  deadlineOf,
  type AnyOpportunity,
  type OpportunityStream,
  type CfpOpp,
  type MootOpp,
  type CompetitionOpp,
  type VacancyLike,
} from "@/lib/opportunities";

type GroupKey = "career" | "academic" | "contests";

const GROUPS: Array<{ key: GroupKey; label: string; streams: OpportunityStream[] }> = [
  { key: "career", label: "Career", streams: ["internship", "job"] },
  { key: "academic", label: "Academic", streams: ["cfp", "moot"] },
  { key: "contests", label: "Contests", streams: ["competition"] },
];

export default function Opportunities() {
  usePageMeta({
    title: "Opportunities — Locus",
    description: "Curated legal internships, jobs, calls for papers, moots, and competitions in one place.",
    path: "/opportunities",
  });

  const [items, setItems] = useState<AnyOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<GroupKey>("career");
  const [filter, setFilter] = useState<OpportunityStream | null>(null);
  const [selected, setSelected] = useState<AnyOpportunity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [vacRes, cfpRes, mootRes, compRes] = await Promise.all([
        supabase.from("vacancies").select("*").in("status", ["live", "archived"]).gt("expires_at", cutoff),
        supabase.from("cfps").select("*").in("status", ["live", "archived"]).gt("expires_at", cutoff),
        supabase.from("moots").select("*").in("status", ["live", "archived"]).gt("expires_at", cutoff),
        supabase.from("competitions").select("*").in("status", ["live", "archived"]).gt("expires_at", cutoff),
      ]);
      if (cancelled) return;
      const merged: AnyOpportunity[] = [];
      (vacRes.data ?? []).forEach((v: any) => merged.push({
        ...v,
        stream: v.opportunity_type === "job" ? "job" : "internship",
      } as VacancyLike));
      (cfpRes.data ?? []).forEach((c: any) => merged.push({
        ...c,
        stream: "cfp",
        deadline: c.submission_deadline,
      } as CfpOpp));
      (mootRes.data ?? []).forEach((m: any) => merged.push({
        ...m,
        stream: "moot",
        deadline: m.registration_deadline,
      } as MootOpp));
      (compRes.data ?? []).forEach((c: any) => merged.push({ ...c, stream: "competition" } as CompetitionOpp));
      merged.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
      setItems(merged);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const currentGroup = GROUPS.find((g) => g.key === activeGroup)!;
  const activeStreams: OpportunityStream[] = filter ? [filter] : currentGroup.streams;

  const filtered = useMemo(
    () => items.filter((i) => activeStreams.includes(i.stream)),
    [items, activeStreams],
  );

  const liveCount = items.filter((i) => new Date(deadlineOf(i)).getTime() > Date.now()).length;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-5 md:mb-8 text-center md:text-left">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Opportunit<span className="text-accent">ies</span>
          </h1>
          <p className="mt-2 text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Internships, jobs, calls for papers, moots, and competitions —
            curated, in one place. {liveCount} live right now.
          </p>
        </header>

        <div className="sticky top-16 z-10 -mx-4 px-4 py-2 mb-6 bg-background/85 backdrop-blur-md space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            {GROUPS.map((g) => {
              const active = activeGroup === g.key;
              const groupCount = items.filter((i) => g.streams.includes(i.stream) && new Date(deadlineOf(i)).getTime() > Date.now()).length;
              return (
                <button
                  key={g.key}
                  onClick={() => { setActiveGroup(g.key); setFilter(null); }}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all",
                    active
                      ? "border-foreground bg-foreground text-background shadow-[3px_3px_0_0_hsl(var(--accent))]"
                      : "border-foreground/70 bg-background text-foreground hover:bg-muted shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--foreground))]",
                  )}
                >
                  <span>{g.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 rounded-md font-mono leading-tight",
                    active ? "opacity-70" : "bg-muted text-muted-foreground",
                  )}>
                    {groupCount}
                  </span>
                </button>
              );
            })}
          </div>

          {currentGroup.streams.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "shrink-0 whitespace-nowrap inline-flex items-center px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all",
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
                      "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all",
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Nothing in this stream right now. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {filtered.map((item) => (
              <OpportunityCard key={`${item.stream}-${item.id}`} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
        )}
      </div>

      <DetailDialog item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function OpportunityCard({ item, onClick }: { item: AnyOpportunity; onClick: () => void }) {
  const meta = STREAM_META[item.stream];
  const Icon = meta.icon;
  const cd = countdown(deadlineOf(item));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left bg-card border-2 border-foreground/80 rounded-2xl p-5 transition-all overflow-hidden",
        "shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:-translate-y-0.5",
      )}
    >
      <span aria-hidden className={cn("absolute left-0 top-0 bottom-0 w-1.5", meta.accentBg)} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border-2 border-foreground/80 mb-2", meta.pillBg, meta.pillText)}>
            <Icon size={10} />
            {meta.pillLabel}
          </span>
          <h3 className="font-heading text-lg md:text-xl font-extrabold tracking-tight text-foreground leading-tight">
            {titleOf(item)}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">{organiserOf(item)}</p>
        </div>
        <span className={cn(
          "shrink-0 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-foreground/70",
          cd.tone === "expired" ? "bg-muted text-muted-foreground"
            : cd.tone === "soon" ? "bg-background text-foreground"
            : "bg-accent text-accent-foreground",
        )}>
          {cd.tone === "soon" ? <AlertTriangle size={12} /> : <Clock size={12} />}
          {cd.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {metaChips(item).map((chip, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <chip.icon size={12} />
            {chip.label}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold truncate">
          {item.source_credit ? `Source: ${item.source_credit}` : "Curated by Locus"}
        </span>
        <span className="text-xs font-bold text-accent inline-flex items-center gap-1 group-hover:underline shrink-0">
          View details <ExternalLink size={12} />
        </span>
      </div>
    </button>
  );
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
        (i.word_limit_min || i.word_limit_max) && { icon: FileText, label: `${i.word_limit_min ?? "—"}–${i.word_limit_max ?? "—"} words` },
        i.submission_fee && { icon: Coins, label: i.submission_fee },
      ].filter(Boolean) as { icon: any; label: string }[];
    case "moot":
      return [
        { icon: Globe, label: i.mode },
        i.venue && { icon: MapPin, label: i.venue },
        i.prize_pool && { icon: Trophy, label: i.prize_pool },
      ].filter(Boolean) as { icon: any; label: string }[];
    case "competition":
      return [
        i.prize_or_stipend && { icon: Trophy, label: i.prize_or_stipend },
        i.mode && { icon: Globe, label: i.mode },
        i.fee && { icon: Coins, label: i.fee },
      ].filter(Boolean) as { icon: any; label: string }[];
  }
}

function DetailDialog({ item, onClose }: { item: AnyOpportunity | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!item) setCopied(false); }, [item]);

  if (!item) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const meta = STREAM_META[item.stream];
  const Icon = meta.icon;
  const cd = countdown(deadlineOf(item));
  const facts = factTiles(item);
  const eligibility = (item as any).eligibility as string | null | undefined;
  const showEligibilityCallout = !!eligibility && eligibility.length > 80;

  const copyLink = async () => {
    const url = `${window.location.origin}/opportunities?focus=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] p-0 overflow-hidden border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))]">
        {/* Hero band */}
        <div className={cn("relative px-6 pt-6 pb-5 border-b-2 border-foreground/80 overflow-hidden")}>
          <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1.5", meta.accentBg)} />
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md border-2 border-foreground/80",
              meta.pillBg, meta.pillText,
            )}>
              <Icon size={12} />
              {meta.pillLabel}
            </span>
            <span className={cn(
              "shrink-0 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-foreground/80",
              cd.tone === "expired" ? "bg-muted text-muted-foreground"
                : cd.tone === "soon" ? "bg-background text-foreground"
                : "bg-accent text-accent-foreground",
            )}>
              {cd.tone === "soon" ? <AlertTriangle size={12} /> : <Clock size={12} />}
              {cd.label}
            </span>
          </div>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              {titleOf(item)}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {organiserOf(item)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-3">
            Posted {new Date(item.posted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="relative">
          <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(88vh-13rem)]">
            {/* Key facts grid */}
            {facts.length > 0 && (
              <section>
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2.5">
                  Key details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {facts.map((f, i) => (
                    <div key={i} className="border-2 border-foreground/15 rounded-lg p-2.5 bg-muted/30">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        <f.icon size={11} />
                        {f.label}
                      </div>
                      <div className="text-sm font-semibold text-foreground/90 break-words leading-snug">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Eligibility callout (long text) */}
            {showEligibilityCallout && (
              <section className="border-2 border-foreground/80 rounded-xl p-4 bg-accent/10">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap size={16} className="text-accent" />
                  <h4 className="text-sm font-extrabold uppercase tracking-wider">Eligibility</h4>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {eligibility}
                </p>
              </section>
            )}

            {/* About */}
            {item.description && (
              <section>
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                  About
                </h4>
                <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed max-w-prose">
                  {item.description}
                </p>
              </section>
            )}

            {/* Source attribution */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {item.source_credit ? `Source: ${item.source_credit}` : "Curated by Locus"}
              </p>
            </div>
          </div>

          {/* Scroll fade */}
          <div aria-hidden className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Sticky CTA bar */}
        <div className="border-t-2 border-foreground/80 bg-background px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="border-2 border-foreground/70 font-bold gap-1.5"
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <CtaButton item={item} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CtaButton({ item }: { item: AnyOpportunity }) {
  let href: string | null = null;
  let label = "Apply";
  switch (item.stream) {
    case "internship":
    case "job":
      href = `mailto:${item.application_email}`;
      label = "Email application";
      break;
    case "cfp":
      href = item.submission_url || (item.contact_email ? `mailto:${item.contact_email}` : null);
      label = item.submission_url ? "Submit paper" : "Email submission";
      break;
    case "moot":
      href = item.registration_url || null;
      label = "Register team";
      break;
    case "competition":
      href = item.application_url || null;
      label = "Apply now";
      break;
  }
  if (!href) {
    return <p className="text-xs text-muted-foreground italic">No public link provided. Check the source for details.</p>;
  }
  const isMail = href.startsWith("mailto:");
  return (
    <Button
      asChild
      className="font-bold border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))]"
    >
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {label} {isMail ? <Mail size={14} className="ml-1.5" /> : <ExternalLink size={14} className="ml-1.5" />}
      </a>
    </Button>
  );
}

type FactTile = { icon: any; label: string; value: string };

function factTiles(item: AnyOpportunity): FactTile[] {
  const tiles: FactTile[] = [];
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const fmtDateTime = (d: string) => new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  switch (item.stream) {
    case "internship":
    case "job":
      tiles.push({ icon: Clock, label: "Deadline", value: fmtDate(item.expires_at) });
      if (item.location) tiles.push({ icon: MapPin, label: "Location", value: item.location });
      if (item.stipend) tiles.push({ icon: Coins, label: "Stipend", value: item.stipend });
      if (item.eligibility && item.eligibility.length <= 80) tiles.push({ icon: GraduationCap, label: "Eligibility", value: item.eligibility });
      tiles.push({ icon: Mail, label: "Apply via", value: item.application_email });
      break;
    case "cfp":
      tiles.push({ icon: Clock, label: "Submission deadline", value: fmtDateTime(item.deadline) });
      if (item.theme) tiles.push({ icon: FileText, label: "Theme", value: item.theme });
      tiles.push({ icon: FileText, label: "Publication", value: prettify(item.publication_type) });
      if (item.word_limit_min || item.word_limit_max) {
        tiles.push({ icon: FileText, label: "Word limit", value: `${item.word_limit_min ?? "—"}–${item.word_limit_max ?? "—"}` });
      }
      tiles.push({ icon: Users, label: "Authorship", value: item.co_authorship_allowed ? "Co-authors allowed" : "Single author" });
      tiles.push({ icon: BadgeCheck, label: "Review", value: item.peer_reviewed ? "Peer-reviewed" : "Editorial" });
      if (item.submission_fee) tiles.push({ icon: Coins, label: "Submission fee", value: item.submission_fee });
      if (item.eligibility && item.eligibility.length <= 80) tiles.push({ icon: GraduationCap, label: "Eligibility", value: item.eligibility });
      break;
    case "moot":
      tiles.push({ icon: Clock, label: "Registration deadline", value: fmtDateTime(item.deadline) });
      tiles.push({ icon: Globe, label: "Mode", value: prettify(item.mode) });
      if (item.venue) tiles.push({ icon: MapPin, label: "Venue", value: item.venue });
      if (item.event_start_date && item.event_end_date) {
        tiles.push({ icon: Calendar, label: "Event window", value: `${fmtDate(item.event_start_date)} → ${fmtDate(item.event_end_date)}` });
      } else if (item.event_start_date) {
        tiles.push({ icon: Calendar, label: "Event date", value: fmtDate(item.event_start_date) });
      }
      if (item.area_of_law) tiles.push({ icon: BadgeCheck, label: "Area of law", value: item.area_of_law });
      if (item.prize_pool) tiles.push({ icon: Trophy, label: "Prize pool", value: item.prize_pool });
      if (item.eligibility && item.eligibility.length <= 80) tiles.push({ icon: GraduationCap, label: "Eligibility", value: item.eligibility });
      break;
    case "competition":
      tiles.push({ icon: Clock, label: "Deadline", value: fmtDateTime(item.deadline) });
      tiles.push({ icon: BadgeCheck, label: "Category", value: prettify(item.category) });
      if (item.mode) tiles.push({ icon: Globe, label: "Mode", value: prettify(item.mode) });
      if (item.event_date) tiles.push({ icon: Calendar, label: "Event date", value: fmtDate(item.event_date) });
      if (item.prize_or_stipend) tiles.push({ icon: Trophy, label: "Prize / stipend", value: item.prize_or_stipend });
      if (item.fee) tiles.push({ icon: Coins, label: "Fee", value: item.fee });
      if (item.eligibility && item.eligibility.length <= 80) tiles.push({ icon: GraduationCap, label: "Eligibility", value: item.eligibility });
      break;
  }
  return tiles;
}
      ))}
    </dl>
  );
}
