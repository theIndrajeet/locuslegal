import { useState } from "react";
import { Briefcase, MapPin, Coins, GraduationCap, Mail, AlertTriangle, Clock, ChevronDown, Check, RotateCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  type Vacancy,
  daysLeft,
  urgencyTone,
  type VacancyApplication,
  applicationStateFor,
} from "@/lib/vacancies";
import { useCountdown } from "@/lib/useCountdown";
import { cn } from "@/lib/utils";

interface Props {
  vacancy: Vacancy;
  onApply?: (v: Vacancy, opts?: { followup?: boolean }) => void;
  archived?: boolean;
  application?: VacancyApplication | null;
}

export default function VacancyCard({ vacancy, onApply, archived = false, application }: Props) {
  const [expanded, setExpanded] = useState(false);
  const days = daysLeft(vacancy.expires_at);
  const tone = urgencyTone(days);
  const { label: countdownLabel, expired } = useCountdown(vacancy.expires_at);
  const isClosed = archived || expired;

  const { state: appState, daysUntilFollowup, lastActionOn } = applicationStateFor(application);

  return (
    <div
      id={`vacancy-${vacancy.id}`}
      className={cn(
        "relative bg-card border-2 rounded-2xl p-5 md:p-6 transition-all",
        isClosed
          ? "border-border/40 opacity-60 grayscale"
          : appState === "applied" || appState === "followed_up"
          ? "border-accent/70 bg-accent/5 shadow-[3px_3px_0_0_hsl(var(--accent)/0.4)]"
          : "border-foreground/80 shadow-[4px_4px_0_0_hsl(var(--accent))] hover:shadow-[6px_6px_0_0_hsl(var(--accent))] hover:-translate-y-0.5",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg md:text-xl font-extrabold tracking-tight text-foreground truncate">
            {vacancy.firm_name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
            <Briefcase size={14} /> {vacancy.role}
            <span
              className={cn(
                "ml-1 inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border-2",
                vacancy.opportunity_type === "job"
                  ? "border-foreground/80 bg-background text-foreground"
                  : "border-foreground/80 bg-accent text-accent-foreground",
              )}
            >
              {vacancy.opportunity_type === "job" ? "Job" : "Internship"}
            </span>
          </p>
        </div>

        {isClosed ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
            Closed
          </span>
        ) : tone === "soon" ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-foreground border-2 border-foreground/70 shrink-0">
            <AlertTriangle size={12} />
            {countdownLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground border-2 border-foreground/70 shrink-0">
            <Clock size={12} />
            {countdownLabel}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
        {vacancy.location && (
          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {vacancy.location}</span>
        )}
        {vacancy.stipend && (
          <span className="inline-flex items-center gap-1"><Coins size={12} /> {vacancy.stipend}</span>
        )}
        {vacancy.eligibility && (
          <span className="inline-flex items-center gap-1"><GraduationCap size={12} /> {vacancy.eligibility}</span>
        )}
      </div>

      {/* Description */}
      {vacancy.description && (
        <div className="mb-4">
          <p className={cn("text-sm text-foreground/80 whitespace-pre-wrap", !expanded && "line-clamp-3")}>
            {vacancy.description}
          </p>
          {vacancy.description.length > 180 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs font-semibold text-accent hover:underline mt-1 inline-flex items-center gap-1"
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
        <div className="text-xs text-muted-foreground truncate">
          {appState === "applied" && lastActionOn ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
              <Check size={12} /> Applied {format(parseISO(lastActionOn), "d MMM")}
            </span>
          ) : appState === "followed_up" && lastActionOn ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
              <Check size={12} /> Followed up {format(parseISO(lastActionOn), "d MMM")}
            </span>
          ) : appState === "followup_ready" && lastActionOn ? (
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              Sent {format(parseISO(lastActionOn), "d MMM")} · time to nudge
            </span>
          ) : vacancy.source_credit ? (
            <span>{vacancy.source_credit}</span>
          ) : (
            <span>Apply by email</span>
          )}
        </div>

        {!isClosed && onApply && appState === "idle" && (
          <Button
            onClick={() => onApply(vacancy)}
            className="font-bold border-2 border-foreground/80 shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Mail size={14} className="mr-1.5" />
            Draft application
          </Button>
        )}

        {!isClosed && appState === "applied" && (
          <Button
            disabled
            variant="outline"
            className="font-bold border-2 border-accent/60 bg-accent/10 text-accent disabled:opacity-100 cursor-not-allowed"
          >
            <Check size={14} className="mr-1.5" />
            Follow up in {daysUntilFollowup}d
          </Button>
        )}

        {!isClosed && appState === "followed_up" && (
          <Button
            disabled
            variant="outline"
            className="font-bold border-2 border-accent/60 bg-accent/10 text-accent disabled:opacity-100 cursor-not-allowed"
          >
            <Check size={14} className="mr-1.5" />
            Followed up
          </Button>
        )}

        {!isClosed && onApply && appState === "followup_ready" && (
          <Button
            onClick={() => onApply(vacancy, { followup: true })}
            variant="outline"
            className="font-bold border-2 border-accent text-foreground bg-background hover:bg-accent hover:text-accent-foreground shadow-[3px_3px_0_0_hsl(var(--accent))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_hsl(var(--accent))]"
          >
            <RotateCw size={14} className="mr-1.5" />
            Draft follow-up
          </Button>
        )}
      </div>
    </div>
  );
}
