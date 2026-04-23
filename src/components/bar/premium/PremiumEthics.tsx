// Locus+ Ethics — 2-stage decision on a paper scenario card.
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard, PremiumLabel } from "./PremiumPrimitives";

export interface EthicsOption { id: string; letter: string; text: string }
export interface EthicsPayload {
  scenario: string;
  decision_options: EthicsOption[];
  correct_decision_id: string;
  consequence_text: string;
  followup_options: EthicsOption[];
  correct_followup_id: string;
  model_reasoning: string;
}
export interface EthicsAnswerState {
  selected_decision_id: string;
  selected_followup_id: string;
}
export type EthicsStage = "decision" | "consequence" | "reveal";

interface AnswerProps {
  mode: "answer";
  payload: EthicsPayload;
  stage: EthicsStage;
  value: Partial<EthicsAnswerState>;
  onChange: (next: Partial<EthicsAnswerState>) => void;
}
interface ReviewProps {
  mode: "review";
  payload: EthicsPayload;
  submitted: EthicsAnswerState;
  stage: "reveal";
}

export function PremiumEthics(props: AnswerProps | ReviewProps) {
  const { payload, stage } = props;

  return (
    <div className="space-y-5">
      <Stepper current={stage} />

      <PremiumCard className="space-y-3">
        <PremiumLabel>The Situation</PremiumLabel>
        <p className="font-serif-display text-[19px] leading-[1.55] text-[hsl(var(--premium-ink))] whitespace-pre-wrap">
          {payload.scenario}
        </p>
      </PremiumCard>

      {stage === "decision" && (
        <ChoiceBlock
          label="Your Decision"
          options={payload.decision_options}
          selected={props.mode === "answer" ? props.value.selected_decision_id ?? null : null}
          onSelect={(id) =>
            props.mode === "answer" && props.onChange({ ...props.value, selected_decision_id: id })
          }
        />
      )}

      {stage === "consequence" && (
        <div className="premium-fade-in space-y-5">
          <Recap
            label="Stage 1 · You chose"
            choice={
              payload.decision_options.find(
                (o) => o.id === (props.mode === "answer" ? props.value.selected_decision_id : ""),
              ) ?? null
            }
          />
          <PremiumCard className="border-l-2 border-l-[hsl(var(--premium-accent))]">
            <PremiumLabel className="mb-2">The Consequence</PremiumLabel>
            <p className="font-serif-display text-[17px] leading-[1.65] text-[hsl(var(--premium-ink))] whitespace-pre-wrap">
              {payload.consequence_text}
            </p>
          </PremiumCard>
          <ChoiceBlock
            label="What now?"
            options={payload.followup_options}
            selected={props.mode === "answer" ? props.value.selected_followup_id ?? null : null}
            onSelect={(id) =>
              props.mode === "answer" && props.onChange({ ...props.value, selected_followup_id: id })
            }
          />
        </div>
      )}

      {stage === "reveal" && props.mode === "review" && (
        <RevealPane payload={payload} submitted={props.submitted} />
      )}
    </div>
  );
}

function Stepper({ current }: { current: EthicsStage }) {
  const steps: { key: EthicsStage; label: string }[] = [
    { key: "decision", label: "Decision" },
    { key: "consequence", label: "Consequence" },
    { key: "reveal", label: "Reveal" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const state = i === idx ? "active" : i < idx ? "done" : "todo";
        return (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-medium transition-colors",
                state === "active" && "bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))]",
                state === "done" && "bg-[hsl(var(--premium-accent))] text-[hsl(var(--premium-ink))]",
                state === "todo" && "border border-[hsl(var(--premium-border))] text-[hsl(var(--premium-muted))] bg-white",
              )}
            >
              {state === "done" ? <Check size={12} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[12px] font-medium",
                state === "active" ? "text-[hsl(var(--premium-ink))]" : "text-[hsl(var(--premium-muted))]",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-8 bg-[hsl(var(--premium-border))]" />}
          </div>
        );
      })}
    </div>
  );
}

function Recap({ label, choice }: { label: string; choice: EthicsOption | null }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--premium-border))] bg-[hsl(var(--premium-accent-tint))] px-4 py-3 flex items-center gap-3">
      <PremiumLabel className="shrink-0">{label}</PremiumLabel>
      <span className="text-[14px] text-[hsl(var(--premium-ink))] font-medium">
        {choice ? `${choice.letter}. ${choice.text}` : "—"}
      </span>
    </div>
  );
}

function ChoiceBlock({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: EthicsOption[];
  selected: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <PremiumLabel>{label}</PremiumLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect?.(o.id)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all flex gap-3 items-start min-h-[88px]",
                isSel
                  ? "border-[hsl(var(--premium-ink))] bg-white shadow-[var(--premium-shadow-sm)]"
                  : "border-[hsl(var(--premium-border))] bg-white hover:border-[hsl(var(--premium-border-strong))]",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-[12px] font-medium",
                  isSel
                    ? "bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))]"
                    : "border border-[hsl(var(--premium-border))] text-[hsl(var(--premium-ink))] bg-white",
                )}
              >
                {o.letter}
              </span>
              <span className="flex-1 text-[14px] leading-relaxed text-[hsl(var(--premium-ink))]">
                {o.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RevealPane({
  payload,
  submitted,
}: {
  payload: EthicsPayload;
  submitted: EthicsAnswerState;
}) {
  const dec = payload.decision_options.find((o) => o.id === submitted.selected_decision_id);
  const fol = payload.followup_options.find((o) => o.id === submitted.selected_followup_id);
  const correctDec = payload.decision_options.find((o) => o.id === payload.correct_decision_id);
  const correctFol = payload.followup_options.find((o) => o.id === payload.correct_followup_id);
  const decOk = submitted.selected_decision_id === payload.correct_decision_id;
  const folOk = submitted.selected_followup_id === payload.correct_followup_id;

  return (
    <div className="space-y-4">
      <RevealRow stage="Stage 1 · Decision" chose={fmt(dec)} correct={fmt(correctDec)} ok={decOk} />
      <RevealRow stage="Stage 2 · Follow-up" chose={fmt(fol)} correct={fmt(correctFol)} ok={folOk} />
      <PremiumCard className="border-l-2 border-l-[hsl(var(--premium-accent))]">
        <PremiumLabel className="mb-2">Why this was the right call</PremiumLabel>
        <p className="font-serif-display text-[16px] leading-[1.65] text-[hsl(var(--premium-ink))] whitespace-pre-wrap">
          {payload.model_reasoning}
        </p>
      </PremiumCard>
    </div>
  );
}

function fmt(o: EthicsOption | undefined) {
  return o ? `${o.letter}. ${o.text}` : "—";
}

function RevealRow({
  stage,
  chose,
  correct,
  ok,
}: {
  stage: string;
  chose: string;
  correct: string;
  ok: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-1.5 bg-white",
        ok
          ? "border-[hsl(var(--premium-success))] border-l-2 border-l-[hsl(var(--premium-success))]"
          : "border-[hsl(var(--premium-danger))] border-l-2 border-l-[hsl(var(--premium-danger))]",
      )}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <Check size={14} className="text-[hsl(var(--premium-success))]" />
        ) : (
          <X size={14} className="text-[hsl(var(--premium-danger))]" />
        )}
        <PremiumLabel>{stage}</PremiumLabel>
      </div>
      <div className="text-[13px]">
        <span className="text-[hsl(var(--premium-muted))]">You chose: </span>
        <span className="font-medium text-[hsl(var(--premium-ink))]">{chose}</span>
      </div>
      {!ok && (
        <div className="text-[13px]">
          <span className="text-[hsl(var(--premium-muted))]">Was: </span>
          <span className="font-medium text-[hsl(var(--premium-success))]">{correct}</span>
        </div>
      )}
    </div>
  );
}
