// Locus+ Document Review — paper document with click-to-flag + side rail.
import { useMemo } from "react";
import { Check, X, AlertTriangle, Flag, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PremiumCard, PremiumLabel } from "./PremiumPrimitives";

interface Span { id: string; text: string }
interface Category { id: string; label: string }
interface CorrectFlag { span_id: string; category_id: string }

interface Payload {
  document_html: string;
  spans: Span[];
  categories: Category[];
  correct_flags: CorrectFlag[];
}

export interface DocReviewAnswerState {
  flagged: { span_id: string; category_id: string }[];
}

interface AnswerProps {
  mode: "answer";
  payload: Payload;
  value: DocReviewAnswerState;
  onChange: (next: DocReviewAnswerState) => void;
}
interface ReviewProps {
  mode: "review";
  payload: Payload;
  submitted: DocReviewAnswerState;
  correct_flags: CorrectFlag[];
}

export function PremiumDocumentReview(props: AnswerProps | ReviewProps) {
  const { payload } = props;

  const correctMap = useMemo(() => {
    const m = new Map<string, string>();
    const list = props.mode === "review" ? props.correct_flags : payload.correct_flags;
    for (const f of list) m.set(f.span_id, f.category_id);
    return m;
  }, [props, payload]);

  const submittedMap = useMemo(() => {
    const m = new Map<string, string>();
    if (props.mode === "review") for (const f of props.submitted.flagged) m.set(f.span_id, f.category_id);
    return m;
  }, [props]);

  const answerMap = useMemo(() => {
    const m = new Map<string, string>();
    if (props.mode === "answer") for (const f of props.value.flagged) m.set(f.span_id, f.category_id);
    return m;
  }, [props]);

  const setFlag = (spanId: string, catId: string | null) => {
    if (props.mode !== "answer") return;
    const next = props.value.flagged.filter((f) => f.span_id !== spanId);
    if (catId) next.push({ span_id: spanId, category_id: catId });
    props.onChange({ flagged: next });
  };

  const segments = useMemo(() => {
    const re = /\{\{(.+?)\}\}/g;
    const result: Array<{ kind: "text" | "span"; text?: string; id?: string }> = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(payload.document_html)) !== null) {
      if (m.index > lastIndex) result.push({ kind: "text", text: payload.document_html.slice(lastIndex, m.index) });
      result.push({ kind: "span", id: m[1] });
      lastIndex = re.lastIndex;
    }
    if (lastIndex < payload.document_html.length) {
      result.push({ kind: "text", text: payload.document_html.slice(lastIndex) });
    }
    return result;
  }, [payload.document_html]);

  const spanText = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of payload.spans) m.set(s.id, s.text);
    return m;
  }, [payload.spans]);

  const catLabel = (id?: string | null) =>
    id ? payload.categories.find((c) => c.id === id)?.label ?? id : "";

  const flaggedList = props.mode === "answer" ? props.value.flagged : props.submitted.flagged;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
      {/* Document */}
      <article className="premium-paper p-7 md:p-9">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[hsl(var(--premium-border))]">
          <PremiumLabel>Document · For Review</PremiumLabel>
          <span className="text-[11px] text-[hsl(var(--premium-subtle))]">CONFIDENTIAL</span>
        </div>
        <div className="font-serif-display text-[17px] leading-[1.8] whitespace-pre-wrap text-[hsl(var(--premium-ink))]">
          {segments.map((seg, i) => {
            if (seg.kind === "text") return <span key={i}>{seg.text}</span>;
            const id = seg.id!;
            const text = spanText.get(id) ?? id;

            if (props.mode === "review") {
              const submitted = submittedMap.get(id);
              const correct = correctMap.get(id);
              const isCorrectHit = !!submitted && submitted === correct;
              const isMissed = !submitted && !!correct;
              const isFalseFlag = !!submitted && !correct;
              const isWrongCat = !!submitted && !!correct && submitted !== correct;
              return (
                <span
                  key={i}
                  className={cn(
                    "px-0.5 -mx-0.5 rounded transition-colors inline",
                    isCorrectHit && "bg-[hsl(152_55%_36%/0.14)] underline decoration-[hsl(var(--premium-success))] decoration-2 underline-offset-4",
                    isMissed && "bg-[hsl(4_65%_48%/0.10)] underline decoration-[hsl(var(--premium-danger))] decoration-2 underline-offset-4 decoration-dashed",
                    isFalseFlag && "bg-[hsl(45_100%_51%/0.20)] underline decoration-[hsl(var(--premium-accent))] decoration-2 underline-offset-4",
                    isWrongCat && "bg-[hsl(4_65%_48%/0.10)] underline decoration-[hsl(var(--premium-danger))] decoration-2 underline-offset-4",
                  )}
                  title={
                    isCorrectHit
                      ? `Correct: ${catLabel(correct)}`
                      : isMissed
                        ? `Missed: ${catLabel(correct)}`
                        : isFalseFlag
                          ? `False flag: ${catLabel(submitted)}`
                          : isWrongCat
                            ? `Wrong category — ${catLabel(submitted)} vs ${catLabel(correct)}`
                            : ""
                  }
                >
                  {text}
                </span>
              );
            }

            const chosen = answerMap.get(id);
            return (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "px-0.5 -mx-0.5 rounded inline cursor-pointer transition-all",
                      chosen
                        ? "bg-[hsl(45_100%_51%/0.22)] underline decoration-[hsl(var(--premium-accent))] decoration-2 underline-offset-4"
                        : "underline decoration-dotted decoration-[hsl(var(--premium-border-strong))] underline-offset-4 hover:bg-[hsl(45_100%_51%/0.10)]",
                    )}
                  >
                    {text}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-72 border-[hsl(var(--premium-border))] bg-white p-2 rounded-xl shadow-[var(--premium-shadow)]"
                >
                  <div className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--premium-muted))]">
                    Flag this clause
                  </div>
                  <div className="space-y-0.5">
                    {payload.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFlag(id, c.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-[13px] rounded-lg transition-colors flex items-center gap-2",
                          chosen === c.id
                            ? "bg-[hsl(45_100%_51%/0.15)] text-[hsl(var(--premium-ink))]"
                            : "text-[hsl(var(--premium-ink))] hover:bg-[hsl(40_25%_94%)]",
                        )}
                      >
                        <Flag size={12} className="text-[hsl(var(--premium-muted))]" />
                        {c.label}
                      </button>
                    ))}
                    {chosen && (
                      <button
                        type="button"
                        onClick={() => setFlag(id, null)}
                        className="w-full text-left px-2.5 py-2 text-[12px] rounded-lg transition-colors text-[hsl(var(--premium-muted))] hover:bg-[hsl(40_25%_94%)] flex items-center gap-2"
                      >
                        <X size={11} /> Clear flag
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </article>

      {/* Side rail */}
      <aside className="space-y-5">
        <PremiumCard>
          <PremiumLabel className="mb-3">Categories</PremiumLabel>
          <div className="flex flex-wrap gap-1.5">
            {payload.categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--premium-border))] bg-[hsl(var(--premium-bg))] px-2.5 py-1 text-[11px] text-[hsl(var(--premium-ink))]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--premium-accent))]" />
                {c.label}
              </span>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center justify-between mb-3">
            <PremiumLabel>Flags</PremiumLabel>
            <span className="text-[11px] text-[hsl(var(--premium-muted))]">{flaggedList.length}</span>
          </div>
          {flaggedList.length === 0 ? (
            <p className="text-[12px] italic text-[hsl(var(--premium-subtle))]">
              Click any underlined phrase to flag it.
            </p>
          ) : (
            <ul className="space-y-2">
              {flaggedList.map((f) => (
                <li key={f.span_id} className="text-[12px] leading-snug">
                  <div className="flex items-start gap-1.5">
                    <Plus size={11} className="mt-0.5 text-[hsl(var(--premium-muted))]" />
                    <div>
                      <div className="text-[hsl(var(--premium-ink))] font-medium">
                        {catLabel(f.category_id)}
                      </div>
                      <div className="text-[hsl(var(--premium-muted))] italic">
                        "{(spanText.get(f.span_id) ?? "").slice(0, 70)}…"
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>

        {props.mode === "review" && (
          <ReviewBreakdown
            payload={payload}
            submitted={props.submitted}
            correct_flags={props.correct_flags}
          />
        )}
      </aside>
    </div>
  );
}

function ReviewBreakdown({
  payload,
  submitted,
  correct_flags,
}: {
  payload: Payload;
  submitted: DocReviewAnswerState;
  correct_flags: CorrectFlag[];
}) {
  const correctSet = new Map(correct_flags.map((f) => [f.span_id, f.category_id]));
  const submittedMap = new Map(submitted.flagged.map((f) => [f.span_id, f.category_id]));
  const spanText = new Map(payload.spans.map((s) => [s.id, s.text]));
  const catLabel = (id: string) => payload.categories.find((c) => c.id === id)?.label ?? id;

  const missed = correct_flags.filter((f) => !submittedMap.has(f.span_id));
  const falseFlags = submitted.flagged.filter((f) => !correctSet.has(f.span_id));
  const wrongCats = submitted.flagged.filter(
    (f) => correctSet.has(f.span_id) && correctSet.get(f.span_id) !== f.category_id,
  );

  if (missed.length === 0 && falseFlags.length === 0 && wrongCats.length === 0) {
    return (
      <div className="premium-paper p-4 flex items-start gap-3 border-l-2 border-l-[hsl(var(--premium-success))]">
        <Check size={16} className="text-[hsl(var(--premium-success))] mt-0.5" />
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--premium-success))] mb-0.5 font-medium">
            Clean Pass
          </div>
          <p className="text-[13px] text-[hsl(var(--premium-ink))]">
            Every flag landed correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PremiumCard className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={13} className="text-[hsl(var(--premium-accent))]" />
        <PremiumLabel>Where points were lost</PremiumLabel>
      </div>
      {missed.length > 0 && (
        <Section label={`Missed (${missed.length})`} tone="danger">
          {missed.map((f) => (
            <li key={f.span_id}>
              <span className="italic">"{(spanText.get(f.span_id) ?? "").slice(0, 60)}…"</span> —{" "}
              <strong className="font-medium">{catLabel(f.category_id)}</strong>.
            </li>
          ))}
        </Section>
      )}
      {falseFlags.length > 0 && (
        <Section label={`False flags (${falseFlags.length})`} tone="warn">
          {falseFlags.map((f) => (
            <li key={f.span_id}>
              <span className="italic">"{(spanText.get(f.span_id) ?? "").slice(0, 60)}…"</span> —
              this clause is fine.
            </li>
          ))}
        </Section>
      )}
      {wrongCats.length > 0 && (
        <Section label={`Wrong category (${wrongCats.length})`} tone="danger">
          {wrongCats.map((f) => (
            <li key={f.span_id}>
              You chose <strong className="font-medium">{catLabel(f.category_id)}</strong>, was{" "}
              <strong className="font-medium">{catLabel(correctSet.get(f.span_id)!)}</strong>.
            </li>
          ))}
        </Section>
      )}
    </PremiumCard>
  );
}

function Section({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "danger" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "text-[10px] uppercase tracking-[0.18em] mb-1 font-medium",
          tone === "danger" ? "text-[hsl(var(--premium-danger))]" : "text-[hsl(35_85%_42%)]",
        )}
      >
        {label}
      </div>
      <ul className="space-y-1 text-[12px] text-[hsl(var(--premium-ink))]">{children}</ul>
    </div>
  );
}
