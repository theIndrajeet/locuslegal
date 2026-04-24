import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";
import { McqRenderer } from "./renderers/McqRenderer";
import { IssueSpotterRenderer } from "./renderers/IssueSpotterRenderer";
import { JurisdictionRenderer } from "./renderers/JurisdictionRenderer";
import { SpeedRoundRenderer } from "./renderers/SpeedRoundRenderer";
import { DocumentReviewRenderer } from "./renderers/DocumentReviewRenderer";
import { BriefBuilderRenderer } from "./renderers/BriefBuilderRenderer";
import { EthicsRenderer } from "./renderers/EthicsRenderer";
import { ClientCounselingRenderer } from "./renderers/ClientCounselingRenderer";
import { PremiumDocumentReview } from "./premium/PremiumDocumentReview";
import { PremiumBriefBuilder } from "./premium/PremiumBriefBuilder";
import { PremiumEthics } from "./premium/PremiumEthics";
import { PremiumClientCounseling } from "./premium/PremiumClientCounseling";
import { PremiumBadge } from "./premium/PremiumBadge";
import { isPremiumType } from "@/lib/bar/premium";
import { AREA_OF_LAW_LABELS, QUESTION_TYPE_LABELS } from "@/lib/bar/constants";
import { RitChatPanel } from "./rit/RitChatPanel";

interface Props {
  attemptId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AttemptReviewDialog({ attemptId, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    attempt: any;
    challenge: any;
  } | null>(null);

  useEffect(() => {
    if (!open || !attemptId) return;
    let active = true;
    setLoading(true);
    setData(null);
    (async () => {
      const { data: attempt } = await supabase
        .from("bar_attempts")
        .select("*, bar_challenges!inner(*)")
        .eq("id", attemptId)
        .maybeSingle();
      if (!active) return;
      if (attempt) {
        setData({ attempt, challenge: attempt.bar_challenges });
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [attemptId, open]);

  const premium = data ? isPremiumType(data.challenge.question_type) : false;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-3xl max-h-[90vh] overflow-y-auto ${premium ? "locus-plus bg-[hsl(var(--premium-bg))]" : ""}`}
      >
        {loading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ReviewContent attempt={data.attempt} challenge={data.challenge} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewContent({ attempt, challenge }: { attempt: any; challenge: any }) {
  const type = challenge.question_type as string;
  const isCorrect = attempt.is_correct as boolean;
  const premium = isPremiumType(type);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline">{QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS]}</Badge>
          <Badge variant="outline">{AREA_OF_LAW_LABELS[challenge.area_of_law as keyof typeof AREA_OF_LAW_LABELS]}</Badge>
          <Badge variant="outline" className="capitalize">{challenge.difficulty}</Badge>
          {premium && <PremiumBadge size="sm" />}
          <div className={`ml-auto flex items-center gap-1 text-sm font-bold ${isCorrect ? "text-emerald-500" : "text-rose-500"}`}>
            {isCorrect ? <Check size={16} /> : <X size={16} />}
            {attempt.points_awarded > 0 ? `+${attempt.points_awarded}` : 0} pts
          </div>
        </div>
        <DialogTitle
          className={
            premium
              ? "text-left text-2xl md:text-3xl tracking-tight text-[hsl(var(--premium-ink))]"
              : "text-left"
          }
          style={premium ? { fontFamily: "'Instrument Serif', serif" } : undefined}
        >
          {challenge.title}
        </DialogTitle>
        {challenge.source_citation && (
          <DialogDescription
            className={`italic text-left ${premium ? "text-[hsl(var(--premium-subtle))]" : ""}`}
          >
            {challenge.source_citation}
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="space-y-4 mt-2">
        <Card
          className={
            premium
              ? "border border-[hsl(var(--premium-border))] bg-white p-4 shadow-none"
              : "border-2 border-border p-4"
          }
        >
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              premium ? "text-[hsl(var(--premium-ink))]" : ""
            }`}
          >
            {challenge.prompt}
          </p>
        </Card>

        {type === "mcq" && (
          <McqRenderer
            mode="review"
            payload={{ options: challenge.payload.options }}
            submittedId={(attempt.submitted_answer as any)?.selected_option_id ?? null}
            correctId={challenge.payload.correct_option_id}
          />
        )}
        {type === "issue_spotter" && (
          <IssueSpotterRenderer
            mode="review"
            payload={{ issue_options: challenge.payload.issue_options }}
            submittedIds={(attempt.submitted_answer as any)?.selected_issue_ids ?? []}
            correctIds={challenge.payload.correct_issue_ids ?? []}
          />
        )}
        {type === "jurisdiction" && (
          <JurisdictionRenderer
            mode="review"
            payload={{ options: challenge.payload.options }}
            submittedId={(attempt.submitted_answer as any)?.selected_option_id ?? null}
            correctId={challenge.payload.correct_option_id}
          />
        )}
        {type === "speed_round" && (() => {
          const subMap = new Map<string, string>(
            ((attempt.submitted_answer as any)?.answers ?? []).map((a: any) => [a.question_id, a.submitted ?? ""]),
          );
          const per = (challenge.payload.questions ?? []).map((q: any) => {
            const submitted = subMap.get(q.id) ?? "";
            const got_right = submitted.trim().toLowerCase() === String(q.answer).trim().toLowerCase() && submitted.trim().length > 0;
            return { id: q.id, prompt: q.prompt, submitted, correct: q.answer, got_right };
          });
          return <SpeedRoundRenderer mode="review" perQuestion={per} />;
        })()}
        {type === "document_review" && (
          <PremiumDocumentReview
            mode="review"
            payload={challenge.payload}
            submitted={(attempt.submitted_answer as any) ?? { flagged: [] }}
            correct_flags={challenge.payload.correct_flags ?? []}
          />
        )}
        {type === "brief_builder" && (
          <BriefBuilderReview
            payload={challenge.payload}
            submitted={(attempt.submitted_answer as any) ?? { step_answers: [] }}
          />
        )}
        {type === "ethics" && (
          <PremiumEthics
            mode="review"
            payload={challenge.payload}
            stage="reveal"
            submitted={(attempt.submitted_answer as any) ?? { selected_decision_id: "", selected_followup_id: "" }}
          />
        )}
        {type === "client_counseling" && (
          <PremiumClientCounseling
            mode="review"
            payload={challenge.payload}
            submitted={(attempt.submitted_answer as any) ?? { turn_picks: [] }}
          />
        )}

        {challenge.explanation && (
          <Card
            className={
              premium
                ? "border border-[hsl(var(--premium-border))] bg-white p-4 shadow-none"
                : "border-2 border-border p-4 bg-muted/30"
            }
          >
            <div
              className={
                premium
                  ? "text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--premium-muted))] font-medium mb-2"
                  : "text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2"
              }
            >
              Why?
            </div>
            <p className={`text-sm leading-relaxed ${premium ? "text-[hsl(var(--premium-ink))]" : ""}`}>
              {challenge.explanation}
            </p>
          </Card>
        )}

        <RitChatPanel
          attemptId={attempt.id}
          challenge={{
            title: challenge.title,
            question_type: challenge.question_type,
          }}
        />
      </div>
    </>
  );
}
