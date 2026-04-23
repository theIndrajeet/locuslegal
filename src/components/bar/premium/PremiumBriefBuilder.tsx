// Locus+ Brief Builder — 4-step rail, focused step pane, paper aesthetic.
import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard, PremiumLabel } from "./PremiumPrimitives";

export interface BriefMcqOption {
  id: string;
  letter: string;
  title: string;
  desc?: string;
  meta?: string;
}
export interface BriefBlock { id: string; text: string }
export interface BriefStep {
  kind: "mcq" | "order";
  label: string;
  prompt: string;
  options?: BriefMcqOption[];
  correct_option_id?: string;
  blocks?: BriefBlock[];
  correct_order?: string[];
}
export interface BriefPayload {
  fact_pattern: string;
  citation?: string;
  steps: BriefStep[];
}
export interface BriefStepAnswer {
  step_index: number;
  selected_option_id?: string;
  ordered_block_ids?: string[];
}
export interface BriefAnswerState {
  step_answers: BriefStepAnswer[];
}

interface CommonProps {
  payload: BriefPayload;
  currentStep: number;
}
interface AnswerProps extends CommonProps {
  mode: "answer";
  value: BriefAnswerState;
  onChange: (next: BriefAnswerState) => void;
  onAdvance: () => void;
}
interface ReviewProps extends CommonProps {
  mode: "review";
  submitted: BriefAnswerState;
}

export function PremiumBriefBuilder(props: AnswerProps | ReviewProps) {
  const { payload, currentStep } = props;
  const step = payload.steps[currentStep];

  return (
    <div className="space-y-5">
      <StepRail steps={payload.steps} current={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-5">
        <PremiumCard className="space-y-3">
          <PremiumLabel>The Brief · Fact Pattern</PremiumLabel>
          <p className="font-serif-display text-[16px] leading-[1.7] text-[hsl(var(--premium-ink))] whitespace-pre-wrap">
            {payload.fact_pattern}
          </p>
          {payload.citation && (
            <div className="pt-3 border-t border-[hsl(var(--premium-border))] text-[11px] italic text-[hsl(var(--premium-muted))]">
              {payload.citation}
            </div>
          )}
        </PremiumCard>

        <PremiumCard className="space-y-4">
          <div>
            <PremiumLabel>
              Step {currentStep + 1} of {payload.steps.length} · {step.label}
            </PremiumLabel>
            <h2 className="mt-2 font-serif-display text-[22px] leading-snug text-[hsl(var(--premium-ink))]">
              {step.prompt}
            </h2>
          </div>

          {step.kind === "mcq" && (
            <McqBlock
              step={step}
              mode={props.mode}
              selected={
                props.mode === "answer"
                  ? props.value.step_answers.find((a) => a.step_index === currentStep)?.selected_option_id ?? null
                  : props.submitted.step_answers.find((a) => a.step_index === currentStep)?.selected_option_id ?? null
              }
              onSelect={
                props.mode === "answer"
                  ? (id) => {
                      const next = (props as AnswerProps).value.step_answers.filter(
                        (a) => a.step_index !== currentStep,
                      );
                      next.push({ step_index: currentStep, selected_option_id: id });
                      (props as AnswerProps).onChange({ step_answers: next });
                    }
                  : undefined
              }
            />
          )}
          {step.kind === "order" && (
            <OrderBlock
              step={step}
              mode={props.mode}
              order={
                props.mode === "answer"
                  ? props.value.step_answers.find((a) => a.step_index === currentStep)?.ordered_block_ids ??
                    (step.blocks?.map((b) => b.id) ?? [])
                  : props.submitted.step_answers.find((a) => a.step_index === currentStep)?.ordered_block_ids ?? []
              }
              onChange={
                props.mode === "answer"
                  ? (order) => {
                      const next = (props as AnswerProps).value.step_answers.filter(
                        (a) => a.step_index !== currentStep,
                      );
                      next.push({ step_index: currentStep, ordered_block_ids: order });
                      (props as AnswerProps).onChange({ step_answers: next });
                    }
                  : undefined
              }
            />
          )}
        </PremiumCard>
      </div>
    </div>
  );
}

function StepRail({ steps, current }: { steps: BriefStep[]; current: number }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {steps.map((s, i) => {
        const state = i === current ? "active" : i < current ? "done" : "todo";
        return (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
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
                  "text-[12px] font-medium tracking-wide",
                  state === "active" ? "text-[hsl(var(--premium-ink))]" : "text-[hsl(var(--premium-muted))]",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="h-px w-8 bg-[hsl(var(--premium-border))]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function McqBlock({
  step,
  mode,
  selected,
  onSelect,
}: {
  step: BriefStep;
  mode: "answer" | "review";
  selected: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {(step.options ?? []).map((o) => {
        const isSelected = selected === o.id;
        const isCorrect = mode === "review" && o.id === step.correct_option_id;
        const isWrong = mode === "review" && isSelected && !isCorrect;
        return (
          <button
            key={o.id}
            type="button"
            disabled={mode === "review"}
            onClick={() => onSelect?.(o.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all flex gap-3 items-start",
              mode === "review"
                ? isCorrect
                  ? "border-[hsl(var(--premium-success))] bg-[hsl(152_55%_36%/0.08)]"
                  : isWrong
                    ? "border-[hsl(var(--premium-danger))] bg-[hsl(4_65%_48%/0.06)]"
                    : "border-[hsl(var(--premium-border))] bg-white opacity-60"
                : isSelected
                  ? "border-[hsl(var(--premium-ink))] bg-white shadow-[var(--premium-shadow-sm)]"
                  : "border-[hsl(var(--premium-border))] bg-white hover:border-[hsl(var(--premium-border-strong))]",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-[12px] font-medium transition-colors",
                isCorrect && mode === "review"
                  ? "bg-[hsl(var(--premium-success))] text-white"
                  : isWrong
                    ? "bg-[hsl(var(--premium-danger))] text-white"
                    : isSelected
                      ? "bg-[hsl(var(--premium-ink))] text-[hsl(var(--premium-bg))]"
                      : "border border-[hsl(var(--premium-border))] text-[hsl(var(--premium-ink))] bg-white",
              )}
            >
              {o.letter}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-[hsl(var(--premium-ink))]">{o.title}</div>
              {o.desc && <div className="text-[12px] text-[hsl(var(--premium-muted))] mt-0.5">{o.desc}</div>}
              {o.meta && (
                <div className="text-[11px] italic text-[hsl(var(--premium-subtle))] mt-1">{o.meta}</div>
              )}
            </div>
            {mode === "review" && isCorrect && (
              <Check size={15} className="text-[hsl(var(--premium-success))] mt-1" />
            )}
            {mode === "review" && isWrong && (
              <X size={15} className="text-[hsl(var(--premium-danger))] mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function OrderBlock({
  step,
  mode,
  order,
  onChange,
}: {
  step: BriefStep;
  mode: "answer" | "review";
  order: string[];
  onChange?: (next: string[]) => void;
}) {
  const blocks = useMemo(() => step.blocks ?? [], [step.blocks]);
  const blockMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of blocks) m.set(b.id, b.text);
    return m;
  }, [blocks]);
  const correctOrder = useMemo(() => step.correct_order ?? [], [step.correct_order]);
  const correctIndex = useMemo(() => {
    const m = new Map<string, number>();
    correctOrder.forEach((id, i) => m.set(id, i));
    return m;
  }, [correctOrder]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!onChange) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(String(active.id));
    const newIdx = order.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(order, oldIdx, newIdx));
  };

  const move = (i: number, dir: -1 | 1) => {
    if (!onChange) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    onChange(arrayMove(order, i, j));
  };

  if (mode === "review") {
    return (
      <div className="space-y-2">
        {(order.length ? order : blocks.map((b) => b.id)).map((id, i) => {
          const expectedAt = correctIndex.get(id);
          const correct = expectedAt === i;
          return (
            <div
              key={id}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border bg-white",
                correct
                  ? "border-[hsl(var(--premium-success))] bg-[hsl(152_55%_36%/0.06)]"
                  : "border-[hsl(var(--premium-danger))] bg-[hsl(4_65%_48%/0.05)]",
              )}
            >
              <span className="font-serif-display text-[18px] text-[hsl(var(--premium-muted))] w-7">
                {i + 1}
              </span>
              <span className="flex-1 text-[13px] text-[hsl(var(--premium-ink))] leading-relaxed">
                {blockMap.get(id) ?? id}
              </span>
              {correct ? (
                <Check size={14} className="text-[hsl(var(--premium-success))]" />
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--premium-danger))]">
                  was #{(expectedAt ?? 0) + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((id, i) => (
            <SortableRow
              key={id}
              id={id}
              index={i}
              total={order.length}
              text={blockMap.get(id) ?? id}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  index,
  total,
  text,
  onUp,
  onDown,
}: {
  id: string;
  index: number;
  total: number;
  text: string;
  onUp: () => void;
  onDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl border bg-white transition-shadow",
        isDragging
          ? "border-[hsl(var(--premium-ink))] shadow-[var(--premium-shadow)] z-10"
          : "border-[hsl(var(--premium-border))] hover:border-[hsl(var(--premium-border-strong))]",
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-[hsl(var(--premium-subtle))] hover:text-[hsl(var(--premium-ink))]"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <span className="font-serif-display text-[18px] text-[hsl(var(--premium-muted))] w-7">
        {index + 1}
      </span>
      <span className="flex-1 text-[13px] text-[hsl(var(--premium-ink))] leading-relaxed">{text}</span>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onUp}
          disabled={index === 0}
          className="p-0.5 rounded text-[hsl(var(--premium-muted))] hover:text-[hsl(var(--premium-ink))] disabled:opacity-30"
          aria-label="Move up"
        >
          <ArrowUp size={12} />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={index === total - 1}
          className="p-0.5 rounded text-[hsl(var(--premium-muted))] hover:text-[hsl(var(--premium-ink))] disabled:opacity-30"
          aria-label="Move down"
        >
          <ArrowDown size={12} />
        </button>
      </div>
    </div>
  );
}
