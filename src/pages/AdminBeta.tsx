import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Download, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { BETA_STAGES, TOTAL_TASKS } from "@/content/beta-checklist";
import { cn } from "@/lib/utils";

type TaskResponse = {
  status?: "pass" | "fail" | "blocked";
  notes?: string;
  screenshotPath?: string;
  screenshotName?: string;
};

type FeedbackRow = {
  id: string;
  tester_name: string;
  tester_email: string | null;
  overall_score: number | null;
  general_notes: string | null;
  responses: Record<string, TaskResponse>;
  user_agent: string | null;
  created_at: string;
  tester_code: string | null;
};

type TesterRow = {
  id: string;
  slot_number: number;
  display_name: string;
  code: string | null;
  email: string | null;
  is_public: boolean;
  claimed_at: string | null;
  submitted_at: string | null;
};

const ALL_TASKS = BETA_STAGES.flatMap((s) =>
  s.tasks.map((t) => ({ ...t, stageNumber: s.number, stageTitle: s.title })),
);

export default function AdminBeta() {
  usePageMeta({
    title: "Admin · Beta Feedback",
    description: "Closed-beta tester submissions.",
    path: "/admin/beta",
  });

  const isAdmin = useAdminRole();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [testers, setTesters] = useState<TesterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAdmin === false) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      const [feedbackRes, testersRes] = await Promise.all([
        supabase.from("beta_feedback").select("*").order("created_at", { ascending: false }),
        supabase
          .from("beta_testers")
          .select("id, slot_number, display_name, code, email, is_public, claimed_at, submitted_at")
          .order("slot_number", { ascending: true }),
      ]);
      if (!mounted) return;
      if (feedbackRes.error) {
        toast("Failed to load submissions", { description: feedbackRes.error.message });
      } else {
        setRows((feedbackRes.data as FeedbackRow[]) ?? []);
      }
      if (testersRes.data) setTesters(testersRes.data as TesterRow[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // Headline metrics
  const metrics = useMemo(() => {
    const total = rows.length;
    let bugs = 0;
    const failsByTask: Record<string, number> = {};
    rows.forEach((row) => {
      Object.entries(row.responses ?? {}).forEach(([taskId, r]) => {
        if (r.status === "fail" || r.status === "blocked") {
          bugs += 1;
          failsByTask[taskId] = (failsByTask[taskId] ?? 0) + 1;
        }
      });
    });
    const topFail = Object.entries(failsByTask).sort((a, b) => b[1] - a[1])[0];
    return { total, bugs, topFailId: topFail?.[0], topFailCount: topFail?.[1] ?? 0 };
  }, [rows]);

  const ensureSignedUrl = async (path: string) => {
    if (signedUrls[path]) return signedUrls[path];
    const { data } = await supabase.storage
      .from("beta-screenshots")
      .createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [path]: data.signedUrl }));
      return data.signedUrl;
    }
    return null;
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const row = rows.find((r) => r.id === id);
    if (row) {
      Object.values(row.responses ?? {}).forEach((r) => {
        if (r.screenshotPath) ensureSignedUrl(r.screenshotPath);
      });
    }
  };

  const exportCsv = () => {
    const headers = [
      "submission_id",
      "tester_name",
      "tester_email",
      "overall_score",
      "submitted_at",
      "task_id",
      "task_title",
      "status",
      "notes",
      "screenshot_path",
    ];
    const lines = [headers.join(",")];
    const escape = (v: unknown) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };
    rows.forEach((row) => {
      ALL_TASKS.forEach((task) => {
        const r = row.responses?.[task.id] ?? {};
        if (!r.status && !r.notes) return;
        lines.push(
          [
            row.id,
            row.tester_name,
            row.tester_email ?? "",
            row.overall_score ?? "",
            row.created_at,
            task.id,
            task.title,
            r.status ?? "",
            r.notes ?? "",
            r.screenshotPath ?? "",
          ]
            .map(escape)
            .join(","),
        );
      });
      // General notes row
      if (row.general_notes) {
        lines.push(
          [
            row.id,
            row.tester_name,
            row.tester_email ?? "",
            row.overall_score ?? "",
            row.created_at,
            "general",
            "General notes",
            "",
            row.general_notes,
            "",
          ]
            .map(escape)
            .join(","),
        );
      }
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locus-beta-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission permanently?")) return;
    const { error } = await supabase.from("beta_feedback").delete().eq("id", id);
    if (error) {
      toast("Delete failed", { description: error.message });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast("Submission deleted");
  };

  if (isAdmin === null || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Admin
            </p>
            <h1 className="font-[Sora] text-3xl md:text-4xl font-black">Beta feedback</h1>
          </div>
          <Button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="border-2 border-foreground bg-card text-foreground hover:bg-muted shadow-[3px_3px_0_0_hsl(var(--foreground))]"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MetricCard label="Submissions" value={metrics.total.toString()} />
          <MetricCard label="Bugs / blockers" value={metrics.bugs.toString()} />
          <MetricCard
            label="Most-failed task"
            value={metrics.topFailId ? `${metrics.topFailId} · ${metrics.topFailCount}` : "—"}
          />
        </div>

        {/* Single shareable beta link */}
        <section className="mb-6 border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-[Sora] text-lg font-black mb-1">Public beta link</h2>
              <p className="font-mono text-xs text-muted-foreground truncate">
                {`${window.location.origin}/beta`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/beta`);
                toast("Link copied");
              }}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 border-2 border-foreground hover:bg-muted transition shrink-0"
            >
              Copy link
            </button>
          </div>
        </section>

        {/* Tester roster */}
        {testers.length > 0 && (
          <section className="mb-8 border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
            <h2 className="font-[Sora] text-lg font-black mb-4">
              Founding Testers · {testers.filter((t) => t.submitted_at).length}/{testers.length} submitted
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground uppercase tracking-wider font-mono text-[10px] border-b border-foreground/20">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Public</th>
                    <th className="py-2 pr-3">Claimed</th>
                    <th className="py-2 pr-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {testers.map((t) => (
                    <tr key={t.id} className="border-b border-foreground/10">
                      <td className="py-2 pr-3 font-mono text-muted-foreground">
                        #{String(t.slot_number).padStart(3, "0")}
                      </td>
                      <td className="py-2 pr-3 font-bold">{t.display_name}</td>
                      <td className="py-2 pr-3 text-muted-foreground truncate max-w-[180px]">
                        {t.email ?? "—"}
                      </td>
                      <td className="py-2 pr-3">{t.is_public ? "Yes" : "No"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {t.claimed_at ? new Date(t.claimed_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {t.submitted_at ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {new Date(t.submitted_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {rows.length === 0 ? (
          <div className="border-2 border-dashed border-foreground/30 p-12 text-center text-muted-foreground">
            No submissions yet. Share the public beta link above.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const expanded = expandedId === row.id;
              const counts = countStatuses(row.responses);
              return (
                <article
                  key={row.id}
                  className="border-2 border-foreground bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(row.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-[Sora] font-bold">{row.tester_name}</h3>
                        {row.tester_email && (
                          <span className="text-xs text-muted-foreground">
                            {row.tester_email}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()} ·{" "}
                        {counts.completed}/{TOTAL_TASKS} tasks · score {row.overall_score ?? "—"}/10
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusDots counts={counts} />
                      {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t-2 border-foreground p-5 space-y-6">
                      {BETA_STAGES.map((stage) => {
                        const stageItems = stage.tasks
                          .map((t) => ({ task: t, r: row.responses?.[t.id] }))
                          .filter((x) => x.r?.status || x.r?.notes);
                        if (stageItems.length === 0) return null;
                        return (
                          <div key={stage.id}>
                            <h4 className="font-[Sora] text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">
                              0{stage.number} · {stage.title}
                            </h4>
                            <div className="space-y-3">
                              {stageItems.map(({ task, r }) => (
                                <div
                                  key={task.id}
                                  className="border border-foreground/20 p-4 bg-background"
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {task.id} · {task.title}
                                    </p>
                                    {r?.status && <StatusBadge status={r.status} />}
                                  </div>
                                  {r?.notes && (
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                      {r.notes}
                                    </p>
                                  )}
                                  {r?.screenshotPath && (
                                    <div className="mt-3">
                                      {signedUrls[r.screenshotPath] ? (
                                        <a
                                          href={signedUrls[r.screenshotPath]}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-block"
                                        >
                                          <img
                                            src={signedUrls[r.screenshotPath]}
                                            alt={r.screenshotName ?? "screenshot"}
                                            className="max-h-48 border border-foreground/30"
                                          />
                                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <ExternalLink className="w-3 h-3" /> Open full size
                                          </span>
                                        </a>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          Loading screenshot…
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {row.general_notes && (
                        <div>
                          <h4 className="font-[Sora] text-sm font-black uppercase tracking-wider text-muted-foreground mb-2">
                            General notes
                          </h4>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed border border-foreground/20 p-4 bg-background">
                            {row.general_notes}
                          </p>
                        </div>
                      )}

                      {row.user_agent && (
                        <p className="text-[10px] text-muted-foreground font-mono break-all">
                          {row.user_agent}
                        </p>
                      )}

                      <div className="flex justify-end pt-2 border-t border-foreground/20">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete submission
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-foreground bg-card p-5 shadow-[3px_3px_0_0_hsl(var(--foreground))]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
        {label}
      </p>
      <p className="font-[Sora] text-3xl font-black">{value}</p>
    </div>
  );
}

function countStatuses(responses: Record<string, TaskResponse>) {
  let pass = 0,
    fail = 0,
    blocked = 0,
    completed = 0;
  Object.values(responses ?? {}).forEach((r) => {
    if (!r.status) return;
    completed += 1;
    if (r.status === "pass") pass += 1;
    else if (r.status === "fail") fail += 1;
    else if (r.status === "blocked") blocked += 1;
  });
  return { pass, fail, blocked, completed };
}

function StatusDots({ counts }: { counts: ReturnType<typeof countStatuses> }) {
  return (
    <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
      <span className="text-emerald-400">{counts.pass}P</span>
      <span className="text-red-400">{counts.fail}F</span>
      <span className="text-yellow-400">{counts.blocked}B</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "pass" | "fail" | "blocked" }) {
  const map = {
    pass: "text-emerald-400 border-emerald-400 bg-emerald-400/10",
    fail: "text-red-400 border-red-400 bg-red-400/10",
    blocked: "text-yellow-400 border-yellow-400 bg-yellow-400/10",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
