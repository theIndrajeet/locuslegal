import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Loader2, FileText, Sparkles, AlertTriangle, CheckCircle2,
  Copy, Check, ScanSearch, RefreshCw, History, Trophy, Trash2,
} from "lucide-react";

type Fix = {
  priority: number;
  area: string;
  issue: string;
  current_text: string;
  rewrite: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
};

type SectionScore = { section: string; score: number; critique: string };

type Analysis = {
  overall_score: number;
  verdict: string;
  candidate_snapshot: {
    name_present: boolean;
    college_detected: string;
    year_or_graduation: string;
    cgpa_or_rank: string;
  };
  tier_fit: {
    tier1_firms: number;
    boutique_litigation: number;
    inhouse_corporate: number;
    psu_government: number;
    policy_thinktank: number;
  };
  section_scores: SectionScore[];
  strengths: string[];
  red_flags: string[];
  prioritized_fixes: Fix[];
  market_signals: {
    nlu_pedigree: string;
    top_tier_moot: boolean;
    tier1_firm_internship: boolean;
    chamber_internship: boolean;
    peer_reviewed_publication: boolean;
    quantified_outputs: boolean;
  };
};

type HistoryItem = {
  id: string;
  overall_score: number;
  verdict: string;
  created_at: string;
  cv_storage_path: string;
};

const CV_MAX_BYTES = 5 * 1024 * 1024;

const TIER_LABELS: Record<keyof Analysis["tier_fit"], string> = {
  tier1_firms: "Tier-1 Firms (CAM · SAM · AZB · Khaitan · Trilegal)",
  boutique_litigation: "Boutique Litigation & Sr. Counsel Chambers",
  inhouse_corporate: "In-house / Corporate Legal",
  psu_government: "PSU · Government · Judiciary",
  policy_thinktank: "Policy & Think Tanks (Vidhi · CCS)",
};

function ScoreRing({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const colorClass =
    score >= 75 ? "text-accent" : score >= 55 ? "text-foreground" : "text-destructive";
  return (
    <div className="relative w-44 h-44">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} className="fill-none stroke-border" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={r}
          className={`fill-none ${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`font-heading text-5xl font-extrabold ${colorClass}`}>{score}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">/ 100</div>
      </div>
    </div>
  );
}

function TierBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 70 ? "bg-accent" : value >= 45 ? "bg-foreground/70" : "bg-destructive/70";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-foreground font-medium truncate pr-2">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full ${tone} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FixCard({ fix }: { fix: Fix }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(fix.rewrite);
    setCopied(true);
    toast.success("Rewrite copied");
    setTimeout(() => setCopied(false), 1500);
  };
  const impactTone =
    fix.impact === "high" ? "bg-destructive/15 text-destructive border-destructive/30" :
    fix.impact === "medium" ? "bg-accent/15 text-accent border-accent/30" :
    "bg-muted text-muted-foreground border-border";
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-heading text-lg font-bold text-accent shrink-0">#{fix.priority}</span>
          <span className="font-heading text-base font-bold truncate">{fix.area}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Badge variant="outline" className={`text-[10px] uppercase ${impactTone}`}>{fix.impact} impact</Badge>
          <Badge variant="outline" className="text-[10px] uppercase">{fix.effort} effort</Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{fix.issue}</p>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Current</div>
          <div className="text-xs p-3 rounded-lg bg-muted/50 border border-border font-mono leading-relaxed whitespace-pre-wrap">
            {fix.current_text || "—"}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-accent">AI Rewrite</span>
            <button onClick={onCopy} className="text-[10px] inline-flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="text-xs p-3 rounded-lg bg-accent/5 border border-accent/30 leading-relaxed whitespace-pre-wrap">
            {fix.rewrite}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalChip({ label, on }: { label: string; on: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
      on ? "bg-accent/10 text-accent border-accent/30" : "bg-muted/30 text-muted-foreground border-border"
    }`}>
      {on ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
      {label}
    </div>
  );
}

export default function CvAnalyser() {
  usePageMeta({
    title: "CV Analyser",
    description: "Brutally honest, AI-powered CV review calibrated for the Indian legal market — Tier-1 firms, litigation chambers, and NLU placement standards.",
    path: "/tools/cv-analyser",
  });
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingCv, setExistingCv] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setAuthReady(true);
      if (!uid) return;
      const { data: prof } = await supabase.from("profiles").select("cv_url").eq("id", uid).maybeSingle();
      if (prof?.cv_url) setExistingCv(prof.cv_url);
      const { data: hist } = await supabase
        .from("cv_analyses")
        .select("id, overall_score, verdict, created_at, cv_storage_path")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(10);
      if (hist) setHistory(hist);
    })();
    return () => { mounted = false; };
  }, []);

  const pick = () => fileRef.current?.click();

  const runAnalysis = async (path: string) => {
    setAnalysing(true);
    setAnalysis(null);
    toast.info("Analysing CV (10–30 seconds) — partner-voice review incoming");
    try {
      const { data, error } = await supabase.functions.invoke("analyse-cv", {
        body: { cv_storage_path: path },
      });
      if (error) {
        let body: { error?: string; retryable?: boolean } | null = null;
        try {
          const resp = (error as unknown as { context?: { response?: Response } })?.context?.response;
          if (resp) body = await resp.clone().json();
        } catch { /* ignore */ }
        if (!body) body = data as { error?: string } | null;
        toast.error(body?.error || error.message || "CV analysis failed");
        return;
      }
      const result = data as { id: string; created_at: string; analysis: Analysis };
      setAnalysis(result.analysis);
      setHistory((prev) => [
        { id: result.id, overall_score: result.analysis.overall_score, verdict: result.analysis.verdict, created_at: result.created_at, cv_storage_path: path },
        ...prev,
      ].slice(0, 10));
      // scroll to results
      setTimeout(() => document.getElementById("cv-analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CV analysis failed");
    } finally {
      setAnalysing(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (file.type !== "application/pdf") { toast.error("CV must be a PDF"); return; }
    if (file.size > CV_MAX_BYTES) { toast.error("CV must be 5 MB or smaller"); return; }
    setUploading(true);
    const path = `${userId}/cv.pdf`;
    const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const uploadedAt = new Date().toISOString();
    await supabase.from("profiles").update({ cv_url: path, cv_uploaded_at: uploadedAt }).eq("id", userId);
    setExistingCv(path);
    setUploading(false);
    toast.success("CV uploaded");
    runAnalysis(path);
  };

  const deleteHistoryItem = async (id: string) => {
    const { error } = await supabase.from("cv_analyses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success("Deleted");
  };

  if (authReady && !userId) {
    return (
      <main className="pt-24 pb-16 container mx-auto px-4 md:px-8 max-w-3xl text-center">
        <ScanSearch className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold mb-3">CV Analyser</h1>
        <p className="text-muted-foreground mb-6">Sign in to get a brutally honest, partner-voice review of your legal CV.</p>
        <Button onClick={() => navigate("/auth?redirect=/tools/cv-analyser")} className="bg-accent text-accent-foreground hover:brightness-110">
          Sign in to continue
        </Button>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-20">
      {/* Hero */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl text-center mb-10">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 px-3 py-1 rounded-full mb-4">
          <Sparkles className="h-3 w-3" /> Tier-1 Recruiter · Litigation Sr. · NLU Placement Chair
        </div>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          The CV review you'd <span className="text-accent">never get</span> in person.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Calibrated for the Indian legal market. No participation trophies. Partner-voice critique with copy-pasteable rewrites.
        </p>
      </section>

      {/* Upload / Action panel */}
      <section className="container mx-auto px-4 md:px-8 max-w-3xl mb-10">
        <Card className="border-border">
          <CardContent className="p-6">
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
            {existingCv ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-9 w-9 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">CV on file</p>
                    <p className="text-xs text-muted-foreground truncate">Ready for analysis</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button onClick={() => runAnalysis(existingCv)} disabled={analysing || uploading} className="bg-accent text-accent-foreground hover:brightness-110">
                    {analysing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {analysing ? "Analysing…" : "Analyse my CV"}
                  </Button>
                  <Button variant="outline" onClick={pick} disabled={uploading || analysing}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">Upload your CV (PDF, max 5 MB)</p>
                <p className="text-sm text-muted-foreground mb-5">Only you can access it. Analysis is private.</p>
                <Button onClick={pick} disabled={uploading} className="bg-accent text-accent-foreground hover:brightness-110">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Choose PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Loading state */}
      {analysing && (
        <section className="container mx-auto px-4 md:px-8 max-w-3xl mb-10">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
              <p className="font-semibold mb-1">Three reviewers are reading your CV…</p>
              <p className="text-sm text-muted-foreground">Tier-1 recruiter · Litigation senior · NLU placement chair</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Results */}
      {analysis && (
        <section id="cv-analysis-results" className="container mx-auto px-4 md:px-8 max-w-5xl space-y-8">
          {/* Verdict + score */}
          <Card className="border-border">
            <CardContent className="p-6 md:p-8 grid md:grid-cols-[auto,1fr] gap-6 items-center">
              <ScoreRing score={analysis.overall_score} />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Partner Verdict</div>
                <p className="font-heading text-xl md:text-2xl font-bold leading-snug mb-4">"{analysis.verdict}"</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {analysis.candidate_snapshot.college_detected && (
                    <span><strong className="text-foreground">College:</strong> {analysis.candidate_snapshot.college_detected}</span>
                  )}
                  {analysis.candidate_snapshot.year_or_graduation && (
                    <span><strong className="text-foreground">Year:</strong> {analysis.candidate_snapshot.year_or_graduation}</span>
                  )}
                  {analysis.candidate_snapshot.cgpa_or_rank && (
                    <span><strong className="text-foreground">CGPA:</strong> {analysis.candidate_snapshot.cgpa_or_rank}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier fit */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" /> Tier-Fit · Honest Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(TIER_LABELS) as (keyof Analysis["tier_fit"])[]).map((k) => (
                <TierBar key={k} label={TIER_LABELS[k]} value={analysis.tier_fit[k]} />
              ))}
            </CardContent>
          </Card>

          {/* Market signals */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-heading">Indian-market signals detected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <SignalChip label={`Pedigree: ${analysis.market_signals.nlu_pedigree.split("-").join(" ")}`} on={analysis.market_signals.nlu_pedigree.includes("nlu")} />
              <SignalChip label="Top-tier moot" on={analysis.market_signals.top_tier_moot} />
              <SignalChip label="Tier-1 firm internship" on={analysis.market_signals.tier1_firm_internship} />
              <SignalChip label="Sr. counsel chamber" on={analysis.market_signals.chamber_internship} />
              <SignalChip label="Peer-reviewed publication" on={analysis.market_signals.peer_reviewed_publication} />
              <SignalChip label="Quantified outputs" on={analysis.market_signals.quantified_outputs} />
            </CardContent>
          </Card>

          {/* Strengths + Red flags */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2 text-accent">
                  <CheckCircle2 className="h-5 w-5" /> Genuine Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.strengths.length ? (
                  <ul className="space-y-2 text-sm">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="text-accent shrink-0">▸</span><span>{s}</span></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">None flagged. The reviewers didn't find a genuine differentiator — that's the headline.</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" /> Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.red_flags.length ? (
                  <ul className="space-y-2 text-sm">
                    {analysis.red_flags.map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="text-destructive shrink-0">▸</span><span>{s}</span></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No red flags. Hygiene is clean.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section scores */}
          {analysis.section_scores.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-heading">Section-by-section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.section_scores.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg border border-border">
                    <div className={`font-heading text-2xl font-extrabold w-12 text-center shrink-0 ${
                      s.score >= 7 ? "text-accent" : s.score >= 4 ? "text-foreground" : "text-destructive"
                    }`}>{s.score}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{s.section}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.critique}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Prioritized fixes */}
          {analysis.prioritized_fixes.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Prioritized fixes — copy &amp; paste</h2>
              <div className="space-y-4">
                {analysis.prioritized_fixes
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .map((f, i) => <FixCard key={i} fix={f} />)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 max-w-5xl mt-12">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-accent" /> Previous reviews
          </h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-accent/40 transition-colors">
                <div className={`font-heading text-xl font-extrabold w-12 text-center ${
                  h.overall_score >= 75 ? "text-accent" : h.overall_score >= 55 ? "text-foreground" : "text-destructive"
                }`}>{h.overall_score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">"{h.verdict}"</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => deleteHistoryItem(h.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
