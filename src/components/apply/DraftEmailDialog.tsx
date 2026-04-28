import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Copy, Mail, AlertCircle, FileText, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

export interface DraftEmailTarget {
  id: string; // unique key for caching
  name: string;
  email: string;
  kind: "firm" | "startup";
  type?: string | null;
  city?: string | null;
  sector?: string | null;
  practice_areas?: string | null;
  legal_needs?: string | null;
  // Optional: pre-fill brief.role with the canonical role from the source (e.g. vacancy).
  roleHint?: string | null;
  // When set, switches the dialog into "follow-up" mode.
  followup?: {
    originalAppliedOn: string; // ISO date
    originalRole: string;
    applicationId?: string; // existing profile_applications row to update
  } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: DraftEmailTarget | null;
  onSent?: () => void;
}

interface UserContext {
  display_name: string | null;
  college: string | null;
  degree: string | null;
  graduation_year: number | null;
  cgpa: number | null;
  bio: string | null;
  subjects_of_interest: string[];
  internships: Array<{
    firm_name: string;
    role: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }>;
  moots: Array<{ competition_name: string; year: number; role: string | null; result: string | null }>;
  publications: Array<{ title: string; publisher: string }>;
  has_cv: boolean;
}

type HighlightKind = "internship" | "subject" | "education" | "moot" | "publication" | "cgpa" | "bio";
interface HighlightChip {
  id: string;
  kind: HighlightKind;
  label: string;
  detail?: string | null;
  matches?: boolean; // overlaps with target
}

interface BriefState {
  fit_reason: string | null;
  role: string;
  availability: string | null;
  availability_custom: string;
  duration: string | null;
  signature_line: string;
  work_mode: string | null;
  highlight_ids: string[];
}

const FIT_OPTIONS = [
  { value: "Practice area match", label: "Practice area match" },
  { value: "Reputation", label: "Reputation" },
  { value: "Location", label: "Location" },
  { value: "Recent matter", label: "Recent matter" },
  { value: "Other", label: "Other" },
];
const AVAIL_OPTIONS = [
  { value: "this summer", label: "This summer" },
  { value: "winter break", label: "Winter break" },
  { value: "specific", label: "Specific months" },
  { value: "flexible", label: "Flexible" },
];
const DURATION_OPTIONS = [
  { value: "2-4 weeks", label: "2–4 weeks" },
  { value: "1 month", label: "1 month" },
  { value: "2 months", label: "2 months" },
  { value: "3+ months", label: "3+ months" },
];
const MODE_OPTIONS = [
  { value: "in-office", label: "In-office" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "either", label: "Either" },
];

const TONES: Array<{ value: "formal" | "warm" | "concise"; label: string }> = [
  { value: "formal", label: "Formal" },
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
];

// In-module cache per target id, keeps drafts during a session.
const draftCache = new Map<string, { subject: string; body: string }>();
const briefCache = new Map<string, BriefState>();

function firstNoun(text: string | null | undefined): string {
  if (!text) return "";
  const stop = new Set(["the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "with", "to", "i", "we", "did", "was", "were", "is", "are", "as"]);
  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  return words.find((w) => !stop.has(w) && w.length > 3) || "";
}

function buildHighlights(user: UserContext, target: DraftEmailTarget | null): HighlightChip[] {
  const chips: HighlightChip[] = [];
  const targetText = [target?.practice_areas, target?.legal_needs, target?.sector, target?.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Internships
  user.internships.forEach((it, i) => {
    const noun = firstNoun(it.description) || firstNoun(it.role);
    const label = noun ? `${noun.charAt(0).toUpperCase() + noun.slice(1)} at ${it.firm_name}` : `Intern at ${it.firm_name}`;
    const detail = `${it.role}${it.description ? " — " + it.description.slice(0, 140) : ""}`;
    const matches = !!targetText && (targetText.includes(noun) || targetText.includes(it.firm_name.toLowerCase().split(" ")[0]));
    chips.push({ id: `int-${i}`, kind: "internship", label, detail, matches });
  });

  // Subjects of interest
  user.subjects_of_interest.forEach((s, i) => {
    const matches = !!targetText && targetText.includes(s.toLowerCase());
    chips.push({
      id: `sub-${i}`,
      kind: "subject",
      label: `Interested in ${s}`,
      detail: s,
      matches,
    });
  });

  // Education
  if (user.college) {
    chips.push({
      id: "edu",
      kind: "education",
      label: `${user.degree ?? "Law student"} at ${user.college}`,
      detail: `${user.degree ?? ""} ${user.college}${user.graduation_year ? `, graduating ${user.graduation_year}` : ""}`.trim(),
    });
  }

  // Moots
  user.moots.forEach((m, i) => {
    chips.push({
      id: `moot-${i}`,
      kind: "moot",
      label: `${m.competition_name} (${m.year})`,
      detail: `${m.role ?? ""} — ${m.result ?? ""}`.trim(),
    });
  });

  // Publications
  user.publications.forEach((p, i) => {
    chips.push({
      id: `pub-${i}`,
      kind: "publication",
      label: `Published "${p.title.slice(0, 60)}"`,
      detail: `${p.title} — ${p.publisher}`,
    });
  });

  // CGPA (only if strong)
  if (user.cgpa && user.cgpa >= 7.5) {
    chips.push({
      id: "cgpa",
      kind: "cgpa",
      label: `CGPA ${user.cgpa.toFixed(2)}`,
      detail: `Current CGPA ${user.cgpa.toFixed(2)}`,
    });
  }

  return chips;
}

function buildGmailUrl(to: string, subject: string, body: string): string {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    to,
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function DraftEmailDialog({ open, onOpenChange, target, onSent }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, ready } = useAuthSession();

  const [user, setUser] = useState<UserContext | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [tone, setTone] = useState<"formal" | "warm" | "concise">("formal");
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [step, setStep] = useState(0); // 0..3
  const [brief, setBrief] = useState<BriefState>({
    fit_reason: null,
    role: "Legal Internship",
    availability: null,
    availability_custom: "",
    duration: null,
    signature_line: "",
    work_mode: null,
    highlight_ids: [],
  });

  // Auth gate — redirect when needed.
  useEffect(() => {
    if (!open || !ready) return;
    if (!userId) {
      toast.info("Sign in to draft a personalised application email.");
      onOpenChange(false);
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [open, ready, userId, navigate, location, onOpenChange]);

  // Load user profile + internships when dialog opens.
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoadingUser(true);

    (async () => {
      const [{ data: profile }, { data: internships }, { data: moots }, { data: publications }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, college, degree, graduation_year, cgpa, bio, subjects_of_interest, cv_url",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("profile_internships")
          .select("firm_name, role, start_date, end_date, description")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })
          .limit(3),
        supabase
          .from("profile_moots")
          .select("competition_name, year, role, result")
          .eq("user_id", userId)
          .order("year", { ascending: false })
          .limit(3),
        supabase
          .from("profile_publications")
          .select("title, publisher")
          .eq("user_id", userId)
          .order("publication_date", { ascending: false })
          .limit(3),
      ]);
      if (cancelled) return;
      setUser({
        display_name: profile?.display_name?.trim() || null,
        college: profile?.college ?? null,
        degree: profile?.degree ?? null,
        graduation_year: profile?.graduation_year ?? null,
        cgpa: profile?.cgpa ? Number(profile.cgpa) : null,
        bio: profile?.bio ?? null,
        subjects_of_interest: profile?.subjects_of_interest ?? [],
        internships: internships ?? [],
        moots: (moots ?? []) as UserContext["moots"],
        publications: publications ?? [],
        has_cv: Boolean(profile?.cv_url),
      });
      setLoadingUser(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // Reset / restore draft when target changes
  // Compute highlight chips from user + target
  const highlights = useMemo<HighlightChip[]>(
    () => (user && target ? buildHighlights(user, target) : []),
    [user, target],
  );

  // Reset / restore draft + brief when target changes
  useEffect(() => {
    if (!open || !target) return;
    const cached = draftCache.get(target.id);
    if (cached) {
      setSubject(cached.subject);
      setBody(cached.body);
    } else {
      setSubject("");
      setBody("");
    }
    const cachedBrief = briefCache.get(target.id);
    if (cachedBrief) {
      setBrief(cachedBrief);
    } else {
      setBrief({
        fit_reason: null,
        role: target.roleHint?.trim() || "Legal Internship",
        availability: null,
        availability_custom: "",
        duration: null,
        signature_line: "",
        work_mode: null,
        highlight_ids: [],
      });
    }
    setStep(0);
  }, [open, target]);

  // Smart-default highlight selection once chips are computed (only if user hasn't picked any yet)
  useEffect(() => {
    if (!target || !highlights.length) return;
    const cached = briefCache.get(target.id);
    if (cached && cached.highlight_ids.length) return;
    const matching = highlights.filter((h) => h.matches).slice(0, 2).map((h) => h.id);
    const fillers = highlights.filter((h) => !matching.includes(h.id)).slice(0, 3 - matching.length).map((h) => h.id);
    setBrief((b) => (b.highlight_ids.length ? b : { ...b, highlight_ids: [...matching, ...fillers].slice(0, 3) }));
  }, [highlights, target]);

  const buildBriefPayload = () => {
    const availability =
      brief.availability === "specific"
        ? brief.availability_custom.trim() || null
        : brief.availability;
    const picked = highlights
      .filter((h) => brief.highlight_ids.includes(h.id))
      .map((h) => ({ kind: h.kind, label: h.label, detail: h.detail ?? null }));
    const payload = {
      fit_reason: brief.fit_reason,
      availability,
      duration: brief.duration,
      signature_line: brief.signature_line.trim() || null,
      work_mode: brief.work_mode,
      highlights: picked,
    };
    // Strip empty
    return payload;
  };

  const isFollowup = !!target?.followup;

  const generate = async () => {
    if (!target || !user) return;
    setGenerating(true);
    const payload = {
      target: {
        name: target.name,
        kind: target.kind,
        type: target.type,
        city: target.city,
        sector: target.sector,
        practice_areas: target.practice_areas,
        legal_needs: target.legal_needs,
      },
      role: isFollowup ? target.followup!.originalRole : brief.role,
      tone,
      brief: isFollowup ? null : buildBriefPayload(),
      mode: isFollowup ? "followup" : "initial",
      original: isFollowup
        ? { applied_on: target.followup!.originalAppliedOn, role: target.followup!.originalRole }
        : null,
      user,
    };

    const invokeOnce = () => supabase.functions.invoke("draft-application-email", { body: payload });

    try {
      let { data, error } = await invokeOnce();

      // Silently retry once on transient cold-start / network failures
      // (no HTTP response was received from the edge function)
      const isTransient =
        !!error &&
        !(error as unknown as { context?: { response?: Response } })?.context?.response &&
        /load failed|failed to fetch|network|timeout/i.test(error.message ?? "");
      if (isTransient) {
        await new Promise((r) => setTimeout(r, 800));
        ({ data, error } = await invokeOnce());
      }

      let errBody: { error?: string } | null = null;
      if (error) {
        try {
          const resp = (error as unknown as { context?: { response?: Response } })?.context?.response;
          if (resp) errBody = await resp.clone().json();
        } catch {
          // ignore
        }
        const msg = errBody?.error || error.message || "Couldn't generate email";
        toast.error(msg);
        return;
      }
      const result = data as { subject?: string; body?: string };
      if (!result?.subject || !result?.body) {
        toast.error("AI returned an empty draft. Try again.");
        return;
      }
      setSubject(result.subject);
      setBody(result.body);
      draftCache.set(target.id, { subject: result.subject, body: result.body });
      briefCache.set(target.id, brief);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate email");
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate when entering follow-up mode (skip the brief wizard).
  useEffect(() => {
    if (!open || !isFollowup || !user || generating) return;
    if (subject.trim() || body.trim()) return; // already drafted/cached
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isFollowup, user]);

  const copyAll = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Email copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Select and copy manually.");
    }
  };

  const openInGmail = () => {
    if (!target || !subject.trim() || !body.trim()) return;
    const truncated = body.length > 1800;
    const sendBody = truncated ? body.slice(0, 1800) : body;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const url = buildGmailUrl(target.email, subject, sendBody);

    // CRITICAL: trigger the open synchronously inside the user gesture — no awaits before this.
    if (isMobile) {
      // mailto: must use location assignment so iOS/Android route to the default mail app.
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // Background: clipboard backup (non-blocking, ignore failures)
    void navigator.clipboard
      ?.writeText(`Subject: ${subject}\n\n${body}`)
      .catch(() => {});

    if (truncated) {
      toast.info("Body was long — full version copied to clipboard. Paste if it truncates.", {
        duration: 6000,
      });
    } else {
      toast.success("Don't forget to attach your CV before sending.", { duration: 6000 });
    }

    // Background: auto-log to tracker (fire-and-forget, never blocks the open)
    if (userId) {
      const today = new Date().toISOString().slice(0, 10);
      const noteExcerpt = body.length > 500 ? body.slice(0, 497) + "…" : body;
      if (isFollowup && target.followup?.applicationId) {
        // Append a follow-up entry to the existing application's notes.
        void (async () => {
          const { data: existing } = await supabase
            .from("profile_applications")
            .select("notes")
            .eq("id", target.followup!.applicationId!)
            .maybeSingle();
          const prevNotes = existing?.notes ?? "";
          const newNotes = `${prevNotes}\n\n--- Follow-up sent on ${today} ---\n${noteExcerpt}`.trim();
          const { error: logErr } = await supabase
            .from("profile_applications")
            .update({ notes: newNotes, status_updated_at: new Date().toISOString() })
            .eq("id", target.followup!.applicationId!);
          if (logErr) {
            toast.error("Email opened, but couldn't log the follow-up.");
          } else {
            toast.success("Follow-up logged to your tracker.", { duration: 4000 });
            onSent?.();
          }
        })();
      } else {
        void supabase
          .from("profile_applications")
          .insert({
            user_id: userId,
            firm_name_snapshot: target.name,
            role: (target.roleHint?.trim() || brief.role),
            applied_on: today,
            method: "email",
            status: "sent",
            notes: `Drafted via Locus AI\n\n${noteExcerpt}`,
          })
          .then(({ error: logErr }) => {
            if (logErr) {
              toast.error("Email opened, but couldn't log to your tracker.");
            } else {
              toast.success("Logged to your Application Tracker.", { duration: 4000 });
              onSent?.();
            }
          });
      }
    }

    onOpenChange(false);
  };

  const canGenerate = !generating && !loadingUser && !!user && brief.role.trim().length > 0;
  const hasDraft = subject.trim().length > 0 && body.trim().length > 0;

  const wordCount = useMemo(
    () => body.trim().split(/\s+/).filter(Boolean).length,
    [body],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            Draft application email
          </DialogTitle>
          <DialogDescription>
            {target ? `To ${target.name} — ${target.email}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Follow-up banner */}
          {isFollowup && target?.followup && (
            <div className="flex items-start gap-2.5 rounded-lg border-2 border-accent bg-accent/10 px-3 py-2.5 text-sm">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-accent" />
              <div className="flex-1">
                <p className="font-semibold">Drafting a polite follow-up</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Referencing your application sent on {target.followup.originalAppliedOn}. Short, no re-pitch.
                </p>
              </div>
            </div>
          )}

          {/* CV banner */}
          {!isFollowup && user && !user.has_cv && (
            <div className="flex items-start gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-accent" />
              <div className="flex-1">
                <p className="font-medium">Add your CV for a stronger, more personalised email.</p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/profile/edit");
                  }}
                  className="text-xs text-accent underline mt-0.5"
                >
                  Add CV in profile
                </button>
              </div>
            </div>
          )}

          {/* Tone (hidden in follow-up mode — always formal-courteous) */}
          {!isFollowup && (
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest">Tone</Label>
              <div className="flex gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={`px-3 py-2 rounded-md border text-xs font-semibold transition-colors ${
                      tone === t.value
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brief Builder Stepper */}
          {!hasDraft && !isFollowup && (
            <div className="rounded-lg border-2 border-border bg-muted/20 p-3 space-y-3 shadow-[3px_3px_0_0_hsl(var(--border))]">
              {/* Progress indicator */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStep(i)}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      i <= step ? "bg-accent" : "bg-border"
                    }`}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
                <span className="font-mono text-[10px] text-muted-foreground ml-2 shrink-0">
                  {step + 1}/4
                </span>
              </div>

              {/* Step 1: Fit */}
              {step === 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-2">What draws you to {target?.name ?? "them"}?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FIT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() =>
                            setBrief((b) => ({ ...b, fit_reason: b.fit_reason === o.value ? null : o.value }))
                          }
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            brief.fit_reason === o.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-widest">Role</Label>
                    <Input
                      value={brief.role}
                      onChange={(e) => setBrief((b) => ({ ...b, role: e.target.value.slice(0, 100) }))}
                      placeholder="Legal Internship"
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Logistics */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-2">When are you available?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAIL_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() =>
                            setBrief((b) => ({ ...b, availability: b.availability === o.value ? null : o.value }))
                          }
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            brief.availability === o.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {brief.availability === "specific" && (
                      <Input
                        value={brief.availability_custom}
                        onChange={(e) =>
                          setBrief((b) => ({ ...b, availability_custom: e.target.value.slice(0, 80) }))
                        }
                        placeholder="e.g. May to July 2026"
                        maxLength={80}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">For how long?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DURATION_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() =>
                            setBrief((b) => ({ ...b, duration: b.duration === o.value ? null : o.value }))
                          }
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            brief.duration === o.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Edge */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-widest">
                      One line they should remember about you
                    </Label>
                    <Input
                      value={brief.signature_line}
                      onChange={(e) =>
                        setBrief((b) => ({ ...b, signature_line: e.target.value.slice(0, 140) }))
                      }
                      placeholder="e.g. drafted my first commercial contract at 19"
                      maxLength={140}
                    />
                    <p className="font-mono text-[10px] text-muted-foreground text-right">
                      {brief.signature_line.length}/140
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Work mode</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MODE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() =>
                            setBrief((b) => ({ ...b, work_mode: b.work_mode === o.value ? null : o.value }))
                          }
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            brief.work_mode === o.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Highlights */}
              {step === 3 && (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold">Highlight from your CV</p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {brief.highlight_ids.length}/4 picked
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pick up to 4. We'll weave them naturally into the email.
                  </p>
                  {highlights.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      Add internships, moots or publications in your profile to surface highlights.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {highlights.map((h) => {
                        const picked = brief.highlight_ids.includes(h.id);
                        const disabled = !picked && brief.highlight_ids.length >= 4;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              setBrief((b) => ({
                                ...b,
                                highlight_ids: picked
                                  ? b.highlight_ids.filter((id) => id !== h.id)
                                  : [...b.highlight_ids, h.id],
                              }))
                            }
                            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              picked
                                ? "border-accent bg-accent text-accent-foreground"
                                : disabled
                                  ? "border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                                  : "border-border bg-background hover:bg-muted"
                            }`}
                            title={h.detail ?? undefined}
                          >
                            {picked && <Check size={12} />}
                            {h.label}
                            {h.matches && !picked && (
                              <span className="font-mono text-[9px] uppercase text-accent ml-1">
                                match
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Stepper nav */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={!canGenerate}
                  className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-40"
                >
                  Skip & generate
                </button>
                {step < 3 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setStep((s) => Math.min(3, s + 1))}
                    className="h-8 bg-foreground text-background hover:bg-foreground/90"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={generate}
                    disabled={!canGenerate}
                    className="h-8 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Drafting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Regenerate button (visible only when draft exists) */}
          {hasDraft && (
            <Button
              onClick={generate}
              disabled={!canGenerate}
              variant="outline"
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Regenerating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate with current brief
                </>
              )}
            </Button>
          )}

          {loadingUser && (
            <p className="text-xs text-muted-foreground text-center">
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
              Loading your profile…
            </p>
          )}

          {isFollowup && !hasDraft && !loadingUser && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-accent" />
              Drafting your follow-up…
            </div>
          )}

          {/* Draft */}
          {hasDraft && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (target) draftCache.set(target.id, { subject: e.target.value, body });
                  }}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[10px] uppercase tracking-widest">Body</Label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {wordCount} words · {body.length} chars
                  </span>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (target) draftCache.set(target.id, { subject, body: e.target.value });
                  }}
                  rows={12}
                  className="font-mono text-sm leading-relaxed"
                />
              </div>

              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-start gap-2">
                <FileText size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Gmail will open with the email pre-filled. Attach your CV before sending — browsers
                  can't auto-attach files.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-1">
                <Button variant="outline" onClick={copyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={openInGmail}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Open in Gmail
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
