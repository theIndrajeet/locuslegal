import { Link } from "react-router-dom";
import { Clock, Layers, Check, Lock } from "lucide-react";
import type { GuideMeta, Audience } from "@/content/playbook";

const audienceTagStyles: Record<Audience, string> = {
  Students: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Firms: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Institutions: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

interface Props {
  guide: GuideMeta;
  status: "unread" | "started" | "completed";
  showStatus: boolean;
}

export function GuideCard({ guide, status, showStatus }: Props) {
  const isComingSoon = guide.comingSoon;

  const inner = (
    <article
      className={`group relative h-full flex flex-col rounded-xl border-2 p-5 transition-all ${
        isComingSoon
          ? "border-border bg-card/40 opacity-60"
          : "border-border bg-card hover:border-accent/60 hover:shadow-[4px_4px_0_0_hsl(var(--accent))] hover:-translate-y-0.5"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {guide.caseNumber}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${audienceTagStyles[guide.audience]}`}
        >
          {guide.audience}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 mb-2">
        {guide.title}
      </h3>

      {/* Stage */}
      <p className="text-xs text-muted-foreground mb-4">{guide.stage}</p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Meta footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {guide.readTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers size={11} /> {guide.sections.length} parts
          </span>
        </div>

        {isComingSoon ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Lock size={10} /> Soon
          </span>
        ) : showStatus && status === "completed" ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground">
            <Check size={12} strokeWidth={3} />
          </span>
        ) : showStatus && status === "started" ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-accent" aria-label="In progress">
            <span className="w-2 h-2 rounded-full bg-accent" />
          </span>
        ) : null}
      </div>
    </article>
  );

  if (isComingSoon) {
    return <div className="block h-full">{inner}</div>;
  }

  return (
    <Link to={`/playbook/${guide.slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
