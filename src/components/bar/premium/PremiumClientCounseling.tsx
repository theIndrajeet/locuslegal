// Locus+ Client Counseling — printed-deposition transcript with inline MCQ.
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard, PremiumLabel } from "./PremiumPrimitives";

export interface CounselingTranscriptTurn {
  turn: number;
  role: "client" | "lawyer";
  text: string;
}
export interface CounselingOption { id: string; letter: string; text: string }
export interface CounselingDecisionTurn {
  turn: number;
  prompt: string;
  options: CounselingOption[];
  correct_option_id: string;
  model_followup?: string;
}
export interface CounselingPayload {
  matter: string;
  transcript: CounselingTranscriptTurn[];
  decision_turns: CounselingDecisionTurn[];
}
export interface CounselingAnswerState {
  turn_picks: { turn: number; selected_option_id: string; followup_text?: string }[];
}

interface AnswerProps {
  mode: "answer";
  payload: CounselingPayload;
  currentTurn: number;
  value: CounselingAnswerState;
  onChange: (next: CounselingAnswerState) => void;
}
interface ReviewProps {
  mode: "review";
  payload: CounselingPayload;
  submitted: CounselingAnswerState;
}

export function PremiumClientCounseling(props: AnswerProps | ReviewProps) {
  const { payload } = props;
  const totalTurns = payload.decision_turns.length;

  if (props.mode === "review") {
    return (
      <div className="space-y-4">
        <MatterHeader matter={payload.matter} subtitle={`Transcript · ${totalTurns} decision turns`} />
        <PremiumCard className="space-y-4">
          {payload.transcript.map((t) => (
            <Turn key={`tr-${t.turn}-${t.role}`} role={t.role} text={t.text} />
          ))}
          {payload.decision_turns.map((dt) => {
            const pick = props.submitted.turn_picks.find((p) => p.turn === dt.turn);
            const chosen = dt.options.find((o) => o.id === pick?.selected_option_id);
            const correct = dt.options.find((o) => o.id === dt.correct_option_id);
            const ok = pick?.selected_option_id === dt.correct_option_id;
            return (
              <div key={`dt-${dt.turn}`} className="space-y-2">
                <Turn role="client" text={dt.prompt} />
                <Turn
                  role="lawyer"
                  text={chosen ? `${chosen.letter}. ${chosen.text}` : "—"}
                  evaluation={ok ? "ok" : "miss"}
                />
                {!ok && correct && (
                  <div className="ml-auto max-w-[78%] text-[12px] rounded-lg bg-[hsl(152_55%_36%/0.07)] border border-[hsl(var(--premium-success))] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--premium-success))] mb-0.5 font-medium">
                      Better
                    </div>
                    <div className="text-[hsl(var(--premium-ink))]">
                      {correct.letter}. {correct.text}
                    </div>
                  </div>
                )}
                {dt.model_followup && (
                  <div className="text-[11px] italic text-[hsl(var(--premium-muted))] pl-3 border-l border-[hsl(var(--premium-border))]">
                    Coach note: {dt.model_followup}
                  </div>
                )}
              </div>
            );
          })}
        </PremiumCard>
      </div>
    );
  }

  // Answer mode
  const currentDt = payload.decision_turns.find((d) => d.turn === props.currentTurn);
  const currentPick = props.value.turn_picks.find((p) => p.turn === props.currentTurn);
  const visibleTranscript = payload.transcript.filter((t) => t.turn <= props.currentTurn);
  const handledDecisions = payload.decision_turns.filter((d) => d.turn < props.currentTurn);

  const setPick = (id: string) => {
    if (props.mode !== "answer" || !currentDt) return;
    const next = props.value.turn_picks.filter((p) => p.turn !== currentDt.turn);
    next.push({ turn: currentDt.turn, selected_option_id: id });
    props.onChange({ turn_picks: next });
  };

  return (
    <div className="space-y-4">
      <MatterHeader
        matter={payload.matter}
        subtitle={`Turn ${props.currentTurn} of ${totalTurns}`}
      />

      <PremiumCard className="space-y-4 max-h-[560px] overflow-y-auto">
        {visibleTranscript.map((t) => (
          <Turn key={`tr-${t.turn}-${t.role}`} role={t.role} text={t.text} />
        ))}
        {handledDecisions.map((dt) => {
          const pick = props.value.turn_picks.find((p) => p.turn === dt.turn);
          const chosen = dt.options.find((o) => o.id === pick?.selected_option_id);
          return (
            <div key={`hist-${dt.turn}`} className="space-y-2">
              <Turn role="client" text={dt.prompt} />
              <Turn role="lawyer" text={chosen ? `${chosen.letter}. ${chosen.text}` : "—"} />
            </div>
          );
        })}

        {currentDt && (
          <div className="space-y-3 premium-fade-in">
            <Turn role="client" text={currentDt.prompt} />

            <div className="ml-auto max-w-[88%] rounded-xl border border-[hsl(var(--premium-border))] bg-[hsl(var(--premium-accent-tint))] p-3 space-y-2">
              <PremiumLabel>How do you respond?</PremiumLabel>
              <div className="space-y-1.5">
                {currentDt.options.map((o) => {
                  const isSel = currentPick?.selected_option_id === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setPick(o.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border bg-white transition-all flex gap-3 items-start",
                        isSel
                          ? "border-[hsl(var(--premium-ink))] shadow-[var(--premium-shadow-sm)]"
                          : "border-[hsl(var(--premium-border))] hover:border-[hsl(var(--premium-border-strong))]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[11px] font-medium",
                          isSel
                            ? "bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))]"
                            : "border border-[hsl(var(--premium-border))] text-[hsl(var(--premium-ink))]",
                        )}
                      >
                        {o.letter}
                      </span>
                      <span className="flex-1 text-[13px] leading-relaxed text-[hsl(var(--premium-ink))]">
                        {o.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!currentDt && (
          <div className="text-center text-[13px] italic text-[hsl(var(--premium-muted))] py-4">
            Consult complete.
          </div>
        )}
      </PremiumCard>
    </div>
  );
}

function MatterHeader({ matter, subtitle }: { matter: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div>
        <PremiumLabel>Matter</PremiumLabel>
        <h2 className="font-serif-display text-[22px] leading-tight text-[hsl(var(--premium-ink))] mt-0.5">
          {matter}
        </h2>
      </div>
      <span className="text-[11px] text-[hsl(var(--premium-muted))]">{subtitle}</span>
    </div>
  );
}

function Turn({
  role,
  text,
  evaluation,
}: {
  role: "client" | "lawyer";
  text: string;
  evaluation?: "ok" | "miss";
}) {
  const isLawyer = role === "lawyer";
  return (
    <div className={cn("flex", isLawyer ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.55]",
          isLawyer
            ? "bg-[hsl(var(--premium-accent-tint))] border border-[hsl(45_85%_82%)] text-[hsl(var(--premium-ink))]"
            : "bg-white border border-[hsl(var(--premium-border))] text-[hsl(var(--premium-ink))]",
          evaluation === "miss" && "border-[hsl(var(--premium-danger))]",
          evaluation === "ok" && "border-[hsl(var(--premium-success))]",
        )}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--premium-muted))] mb-1 font-medium">
          {role}
          {evaluation === "ok" && <Check size={10} className="text-[hsl(var(--premium-success))]" />}
          {evaluation === "miss" && <X size={10} className="text-[hsl(var(--premium-danger))]" />}
        </div>
        <div className="whitespace-pre-wrap font-serif-display text-[15px] leading-[1.55]">{text}</div>
      </div>
    </div>
  );
}
