import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AREA_OF_LAW_LABELS,
  QUESTION_TYPE_LABELS,
  V1_QUESTION_TYPES,
} from "@/lib/bar/constants";
import { computeBasePoints } from "@/lib/bar/scoring";
import {
  McqPayloadSchema,
  IssueSpotterPayloadSchema,
  SpeedRoundPayloadSchema,
  JurisdictionPayloadSchema,
  type AreaOfLaw,
  type Difficulty,
  type QuestionType,
} from "@/lib/bar/types";

type Source = { id: string; title: string; source_type: string };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  sources: Source[];
};

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

export default function ChallengeForm({ open, onOpenChange, onCreated, sources }: Props) {
  const [type, setType] = useState<QuestionType>("mcq");
  const [area, setArea] = useState<AreaOfLaw>("constitutional");
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [sourceId, setSourceId] = useState<string>("__none");
  const [sourcePage, setSourcePage] = useState<string>("");
  const [sourceCitation, setSourceCitation] = useState("");

  // MCQ / Jurisdiction state
  const [options, setOptions] = useState<{ id: string; text: string; jurisdiction?: string; reasoning?: string }[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [correctOption, setCorrectOption] = useState<string>("");

  // Issue Spotter state
  const [issues, setIssues] = useState<{ id: string; text: string }[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [correctIssues, setCorrectIssues] = useState<Set<string>>(new Set());

  // Speed Round state
  const [subQs, setSubQs] = useState<{ id: string; prompt: string; answer: string }[]>(
    Array.from({ length: 5 }, () => ({ id: crypto.randomUUID(), prompt: "", answer: "" })),
  );
  const [timeLimit, setTimeLimit] = useState<number>(60);

  const [busy, setBusy] = useState(false);

  const reset = () => {
    setType("mcq"); setArea("constitutional"); setDiff("easy"); setTitle(""); setPrompt(""); setExplanation("");
    setSourceId("__none"); setSourcePage(""); setSourceCitation("");
    setOptions([{ id: crypto.randomUUID(), text: "" }, { id: crypto.randomUUID(), text: "" }]);
    setCorrectOption("");
    setIssues([{ id: crypto.randomUUID(), text: "" }, { id: crypto.randomUUID(), text: "" }, { id: crypto.randomUUID(), text: "" }]);
    setCorrectIssues(new Set());
    setSubQs(Array.from({ length: 5 }, () => ({ id: crypto.randomUUID(), prompt: "", answer: "" })));
    setTimeLimit(60);
  };

  const buildPayload = (): { ok: true; payload: unknown; questionCount?: number } | { ok: false; msg: string } => {
    if (type === "mcq") {
      const p = { options: options.map((o) => ({ id: o.id, text: o.text.trim() })), correct_option_id: correctOption };
      const r = McqPayloadSchema.safeParse(p);
      if (!r.success) return { ok: false, msg: r.error.errors[0].message };
      return { ok: true, payload: r.data };
    }
    if (type === "jurisdiction") {
      const p = {
        options: options.map((o) => ({ id: o.id, jurisdiction: (o.jurisdiction ?? "").trim(), reasoning: (o.reasoning ?? "").trim() })),
        correct_option_id: correctOption,
      };
      const r = JurisdictionPayloadSchema.safeParse(p);
      if (!r.success) return { ok: false, msg: r.error.errors[0].message };
      return { ok: true, payload: r.data };
    }
    if (type === "issue_spotter") {
      const p = {
        issue_options: issues.map((i) => ({ id: i.id, text: i.text.trim() })),
        correct_issue_ids: [...correctIssues],
      };
      const r = IssueSpotterPayloadSchema.safeParse(p);
      if (!r.success) return { ok: false, msg: r.error.errors[0].message };
      return { ok: true, payload: r.data };
    }
    if (type === "speed_round") {
      const p = {
        questions: subQs.map((q) => ({ id: q.id, prompt: q.prompt.trim(), answer: q.answer.trim() })),
        time_limit_seconds: timeLimit,
      };
      const r = SpeedRoundPayloadSchema.safeParse(p);
      if (!r.success) return { ok: false, msg: r.error.errors[0].message };
      return { ok: true, payload: r.data, questionCount: p.questions.length };
    }
    return { ok: false, msg: "unsupported type" };
  };

  const submit = async () => {
    if (!title.trim() || !prompt.trim()) { toast.error("Title and prompt required"); return; }
    const built = buildPayload();
    if (!built.ok) { toast.error(built.msg); return; }
    const points = computeBasePoints(type, diff, built.questionCount);

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { error } = await supabase.from("bar_challenges").insert({
      source_id: sourceId === "__none" ? null : sourceId,
      source_page: sourcePage ? parseInt(sourcePage, 10) : null,
      source_citation: sourceCitation.trim() || null,
      question_type: type,
      area_of_law: area,
      difficulty: diff,
      title: title.trim(),
      prompt: prompt.trim(),
      explanation: explanation.trim() || null,
      payload: built.payload as never,
      points_base: points,
      status: "draft",
      created_by: user.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge created (draft)");
    reset(); onOpenChange(false); onCreated();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Challenge</SheetTitle>
          <SheetDescription>Saves as draft. Approve from the table.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Question Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {V1_QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={diff} onValueChange={(v) => setDiff(v as Difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Area of Law</Label>
              <Select value={area} onValueChange={(v) => setArea(v as AreaOfLaw)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AREA_OF_LAW_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Title (admin-facing) *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Prompt (shown to students) *</Label>
            <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div>
            <Label>Explanation (optional, shown after answer)</Label>
            <Textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <Label>Source (optional)</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Page</Label>
              <Input type="number" value={sourcePage} onChange={(e) => setSourcePage(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Citation</Label>
              <Input value={sourceCitation} onChange={(e) => setSourceCitation(e.target.value)} />
            </div>
          </div>

          {/* Type-specific subform */}
          <Card className="p-4 border-2 border-border space-y-3">
            {type === "mcq" && (
              <McqEditor options={options} setOptions={setOptions} correct={correctOption} setCorrect={setCorrectOption} />
            )}
            {type === "jurisdiction" && (
              <JurisdictionEditor options={options} setOptions={setOptions} correct={correctOption} setCorrect={setCorrectOption} />
            )}
            {type === "issue_spotter" && (
              <IssueEditor issues={issues} setIssues={setIssues} correct={correctIssues} setCorrect={setCorrectIssues} />
            )}
            {type === "speed_round" && (
              <SpeedRoundEditor subQs={subQs} setSubQs={setSubQs} timeLimit={timeLimit} setTimeLimit={setTimeLimit} />
            )}
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>{busy ? "Saving..." : "Save Draft"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function McqEditor({ options, setOptions, correct, setCorrect }: {
  options: { id: string; text: string }[];
  setOptions: (o: { id: string; text: string }[]) => void;
  correct: string; setCorrect: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Options (2-6) — pick the correct one</Label>
      {options.map((o, i) => (
        <div key={o.id} className="flex items-center gap-2">
          <input type="radio" checked={correct === o.id} onChange={() => setCorrect(o.id)} />
          <Input value={o.text} placeholder={`Option ${i + 1}`} onChange={(e) => {
            const next = [...options]; next[i] = { ...o, text: e.target.value }; setOptions(next);
          }} />
          {options.length > 2 && (
            <Button size="icon" variant="ghost" onClick={() => setOptions(options.filter((x) => x.id !== o.id))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <Button size="sm" variant="outline" onClick={() => setOptions([...options, { id: crypto.randomUUID(), text: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add option
        </Button>
      )}
    </div>
  );
}

function JurisdictionEditor({ options, setOptions, correct, setCorrect }: {
  options: { id: string; text: string; jurisdiction?: string; reasoning?: string }[];
  setOptions: (o: { id: string; text: string; jurisdiction?: string; reasoning?: string }[]) => void;
  correct: string; setCorrect: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Jurisdiction Options (2-5) — pick the correct one</Label>
      {options.map((o, i) => (
        <div key={o.id} className="border border-border rounded-md p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input type="radio" checked={correct === o.id} onChange={() => setCorrect(o.id)} />
            <Input placeholder="Jurisdiction" value={o.jurisdiction ?? ""} onChange={(e) => {
              const next = [...options]; next[i] = { ...o, jurisdiction: e.target.value }; setOptions(next);
            }} />
            {options.length > 2 && (
              <Button size="icon" variant="ghost" onClick={() => setOptions(options.filter((x) => x.id !== o.id))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Textarea placeholder="Reasoning" value={o.reasoning ?? ""} onChange={(e) => {
            const next = [...options]; next[i] = { ...o, reasoning: e.target.value }; setOptions(next);
          }} />
        </div>
      ))}
      {options.length < 5 && (
        <Button size="sm" variant="outline" onClick={() => setOptions([...options, { id: crypto.randomUUID(), text: "", jurisdiction: "", reasoning: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add option
        </Button>
      )}
    </div>
  );
}

function IssueEditor({ issues, setIssues, correct, setCorrect }: {
  issues: { id: string; text: string }[];
  setIssues: (i: { id: string; text: string }[]) => void;
  correct: Set<string>; setCorrect: (s: Set<string>) => void;
}) {
  const toggle = (id: string) => {
    const next = new Set(correct);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCorrect(next);
  };
  return (
    <div className="space-y-2">
      <Label>Issue Options (3-10) — check ALL correct issues</Label>
      {issues.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <Checkbox checked={correct.has(it.id)} onCheckedChange={() => toggle(it.id)} />
          <Input value={it.text} placeholder={`Issue ${i + 1}`} onChange={(e) => {
            const next = [...issues]; next[i] = { ...it, text: e.target.value }; setIssues(next);
          }} />
          {issues.length > 3 && (
            <Button size="icon" variant="ghost" onClick={() => {
              setIssues(issues.filter((x) => x.id !== it.id));
              const c = new Set(correct); c.delete(it.id); setCorrect(c);
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {issues.length < 10 && (
        <Button size="sm" variant="outline" onClick={() => setIssues([...issues, { id: crypto.randomUUID(), text: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add issue
        </Button>
      )}
    </div>
  );
}

function SpeedRoundEditor({ subQs, setSubQs, timeLimit, setTimeLimit }: {
  subQs: { id: string; prompt: string; answer: string }[];
  setSubQs: (q: { id: string; prompt: string; answer: string }[]) => void;
  timeLimit: number; setTimeLimit: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Sub-questions (5-15)</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Time limit (s)</Label>
          <Input type="number" min={30} max={300} className="w-20" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value || "60", 10))} />
        </div>
      </div>
      {subQs.map((q, i) => (
        <div key={q.id} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
          <Input placeholder="Prompt" value={q.prompt} onChange={(e) => {
            const next = [...subQs]; next[i] = { ...q, prompt: e.target.value }; setSubQs(next);
          }} />
          <Input placeholder="Answer" value={q.answer} onChange={(e) => {
            const next = [...subQs]; next[i] = { ...q, answer: e.target.value }; setSubQs(next);
          }} />
          {subQs.length > 5 && (
            <Button size="icon" variant="ghost" onClick={() => setSubQs(subQs.filter((x) => x.id !== q.id))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {subQs.length < 15 && (
        <Button size="sm" variant="outline" onClick={() => setSubQs([...subQs, { id: crypto.randomUUID(), prompt: "", answer: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add sub-question
        </Button>
      )}
    </div>
  );
}
