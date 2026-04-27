import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Paperclip,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ACCESS_CODE, BETA_STAGES, TOTAL_TASKS } from "@/content/beta-checklist";

type TaskStatus = "pass" | "fail" | "blocked";

type TaskResponse = {
  status?: TaskStatus;
  notes?: string;
  screenshotPath?: string;
  screenshotName?: string;
};

type Responses = Record<string, TaskResponse>;

const DRAFT_KEY = "locus-beta-draft-v1";

const statusMeta: Record<
  TaskStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  pass: { label: "Pass", icon: CheckCircle2, color: "text-emerald-400 border-emerald-400 bg-emerald-400/10" },
  fail: { label: "Fail", icon: XCircle, color: "text-red-400 border-red-400 bg-red-400/10" },
  blocked: { label: "Blocked", icon: AlertOctagon, color: "text-yellow-400 border-yellow-400 bg-yellow-400/10" },
};

export default function BetaChecklist() {
  usePageMeta({
    title: "Locus · Closed Beta Checklist",
    description: "Private checklist for Locus closed-beta testers.",
    path: "/beta",
    noindex: true,
  });

  const [search] = useSearchParams();
  const codeParam = search.get("code")?.trim() ?? "";
  const accessGranted = codeParam.toUpperCase() === ACCESS_CODE;

  const [openStage, setOpenStage] = useState<string>(BETA_STAGES[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [score, setScore] = useState<number>(7);
  const [generalNotes, setGeneralNotes] = useState("");
  const [responses, setResponses] = useState<Responses>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // Load draft
  useEffect(() => {
    if (!accessGranted) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.name) setName(parsed.name);
      if (parsed.email) setEmail(parsed.email);
      if (typeof parsed.score === "number") setScore(parsed.score);
      if (parsed.generalNotes) setGeneralNotes(parsed.generalNotes);
      if (parsed.responses) setResponses(parsed.responses);
    } catch {
      /* ignore */
    }
  }, [accessGranted]);

  // Save draft
  useEffect(() => {
    if (!accessGranted || submitted) return;
    const draft = { name, email, score, generalNotes, responses };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore quota */
    }
  }, [accessGranted, submitted, name, email, score, generalNotes, responses]);

  const completedCount = useMemo(
    () =>
      Object.values(responses).filter((r) => r.status !== undefined).length,
    [responses],
  );
  const progressPct = Math.round((completedCount / TOTAL_TASKS) * 100);

  const updateResponse = (taskId: string, patch: Partial<TaskResponse>) => {
    setResponses((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...patch },
    }));
  };

  const handleScreenshot = async (taskId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast("Screenshot too large", { description: "Please keep it under 5 MB." });
      return;
    }
    setUploadingTaskId(taskId);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `drafts/${Date.now()}-${taskId}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("beta-screenshots")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      updateResponse(taskId, { screenshotPath: path, screenshotName: file.name });
      toast("Screenshot attached");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast("Upload failed", { description: msg });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast("Please add your name first");
      return;
    }
    if (completedCount === 0) {
      toast("Mark at least one task before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("beta_feedback").insert({
        tester_name: name.trim(),
        tester_email: email.trim() || null,
        overall_score: score,
        general_notes: generalNotes.trim() || null,
        responses: responses as never,
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast("Submission failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!accessGranted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
        <div className="max-w-md w-full border-2 border-foreground bg-card p-8 shadow-[6px_6px_0_0_hsl(var(--foreground))]">
          <Lock className="w-8 h-8 mb-4" />
          <h1 className="font-[Sora] text-2xl font-black mb-2">This link looks broken</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The access code is missing or wrong. Check the link you were sent — it should look like
            <code className="block mt-3 px-3 py-2 bg-muted text-xs break-all">
              /beta?code=...
            </code>
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
        <div className="max-w-lg w-full border-2 border-foreground bg-card p-10 shadow-[6px_6px_0_0_hsl(var(--foreground))] text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-6 text-primary" strokeWidth={2.5} />
          <h1 className="font-[Sora] text-3xl font-black mb-3">Thank you, {name.split(" ")[0] || "tester"}.</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your feedback is in. We'll triage every bug and reply if anything needs follow-up.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Sticky progress */}
      <div className="sticky top-0 z-30 bg-background border-b-2 border-foreground">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <p className="font-[Sora] text-xs font-bold tracking-widest uppercase">
              Locus · Closed Beta
            </p>
            <p className="text-xs font-mono">
              {completedCount} / {TOTAL_TASKS} tasks
            </p>
          </div>
          <div className="h-2 border border-foreground bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        <h1 className="font-[Sora] text-4xl md:text-5xl font-black leading-tight mb-3">
          Tester checklist
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Walk through Locus the way a real student would. ~30 minutes. Mark each task,
          drop notes for anything weird, attach screenshots when it helps.
        </p>
        <p className="text-xs text-muted-foreground mb-10">
          Your progress auto-saves on this device. You can close the tab and come back.
        </p>

        {/* Stages */}
        <div className="space-y-5">
          {BETA_STAGES.map((stage) => {
            const isOpen = openStage === stage.id;
            const stageDone = stage.tasks.filter(
              (t) => responses[t.id]?.status !== undefined,
            ).length;
            return (
              <section
                key={stage.id}
                className="border-2 border-foreground bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]"
              >
                <button
                  type="button"
                  onClick={() => setOpenStage(isOpen ? "" : stage.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-[Sora] text-2xl font-black text-primary shrink-0">
                      0{stage.number}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-[Sora] text-lg font-bold truncate">
                        {stage.title}
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">
                        {stage.subtitle} · ~{stage.estMinutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {stageDone}/{stage.tasks.length}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t-2 border-foreground divide-y-2 divide-foreground">
                    {stage.tasks.map((task) => {
                      const r = responses[task.id] ?? {};
                      return (
                        <div key={task.id} className="p-5 space-y-4">
                          <div>
                            <div className="flex items-baseline gap-3 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {task.id}
                              </span>
                              <h3 className="font-[Sora] font-bold">{task.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {task.detail}
                            </p>
                          </div>

                          {/* Status pills */}
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(statusMeta) as TaskStatus[]).map((s) => {
                              const meta = statusMeta[s];
                              const Icon = meta.icon;
                              const active = r.status === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateResponse(task.id, { status: s })}
                                  className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition",
                                    active
                                      ? meta.color
                                      : "border-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground",
                                  )}
                                >
                                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  {meta.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Notes + screenshot */}
                          <Textarea
                            placeholder="Bug, friction, idea — anything you noticed."
                            value={r.notes ?? ""}
                            onChange={(e) =>
                              updateResponse(task.id, { notes: e.target.value })
                            }
                            className="border-2 border-foreground bg-background min-h-[70px] text-sm"
                          />

                          <div className="flex items-center gap-3 flex-wrap">
                            <label
                              className={cn(
                                "inline-flex items-center gap-2 px-3 py-1.5 border-2 border-foreground bg-background text-xs font-bold cursor-pointer hover:bg-muted transition",
                                uploadingTaskId === task.id &&
                                  "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {uploadingTaskId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Paperclip className="w-3.5 h-3.5" />
                              )}
                              {r.screenshotPath ? "Replace screenshot" : "Attach screenshot"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTaskId === task.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleScreenshot(task.id, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            {r.screenshotName && (
                              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="truncate max-w-[180px]">
                                  {r.screenshotName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateResponse(task.id, {
                                      screenshotPath: undefined,
                                      screenshotName: undefined,
                                    })
                                  }
                                  className="hover:text-foreground"
                                  aria-label="Remove screenshot"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Wrap-up form */}
        <section className="mt-10 border-2 border-foreground bg-card p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))] space-y-5">
          <h2 className="font-[Sora] text-xl font-black">Tell us who you are</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                Your name <span className="text-primary">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aanya Sharma"
                className="border-2 border-foreground bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                Email (optional)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="So we can follow up"
                className="border-2 border-foreground bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3">
              Overall, how did Locus feel? · {score}/10
            </label>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[score]}
              onValueChange={(v) => setScore(v[0])}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
              <span>Painful</span>
              <span>Loved it</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Anything else
            </label>
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="What's the one thing you wish was different? What surprised you?"
              className="border-2 border-foreground bg-background min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-[Sora] font-black text-base h-12"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit feedback"
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            One submission per tester. Drafts auto-save until you submit.
          </p>
        </section>
      </div>
    </main>
  );
}
