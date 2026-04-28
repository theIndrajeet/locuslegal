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
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: DraftEmailTarget | null;
}

interface UserContext {
  display_name: string | null;
  college: string | null;
  degree: string | null;
  graduation_year: number | null;
  bio: string | null;
  subjects_of_interest: string[];
  internships: Array<{
    firm_name: string;
    role: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }>;
  has_cv: boolean;
}

const TONES: Array<{ value: "formal" | "warm" | "concise"; label: string }> = [
  { value: "formal", label: "Formal" },
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
];

// In-module cache per target id, keeps drafts during a session.
const draftCache = new Map<string, { subject: string; body: string }>();

function buildGmailUrl(to: string, subject: string, body: string): string {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    to,
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function DraftEmailDialog({ open, onOpenChange, target }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, ready } = useAuthSession();

  const [user, setUser] = useState<UserContext | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [tone, setTone] = useState<"formal" | "warm" | "concise">("formal");
  const [role, setRole] = useState("Legal Internship");
  const [extraNote, setExtraNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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
      const [{ data: profile }, { data: internships }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, college, degree, graduation_year, bio, subjects_of_interest, cv_url",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("profile_internships")
          .select("firm_name, role, start_date, end_date, description")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })
          .limit(3),
      ]);
      if (cancelled) return;
      setUser({
        display_name: profile?.display_name?.trim() || null,
        college: profile?.college ?? null,
        degree: profile?.degree ?? null,
        graduation_year: profile?.graduation_year ?? null,
        bio: profile?.bio ?? null,
        subjects_of_interest: profile?.subjects_of_interest ?? [],
        internships: internships ?? [],
        has_cv: Boolean(profile?.cv_url),
      });
      setLoadingUser(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // Reset / restore draft when target changes
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
    setExtraNote("");
    setRole("Legal Internship");
  }, [open, target]);

  const generate = async () => {
    if (!target || !user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("draft-application-email", {
        body: {
          target: {
            name: target.name,
            kind: target.kind,
            type: target.type,
            city: target.city,
            sector: target.sector,
            practice_areas: target.practice_areas,
            legal_needs: target.legal_needs,
          },
          role,
          tone,
          extra_note: extraNote.trim() || null,
          user,
        },
      });

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate email");
    } finally {
      setGenerating(false);
    }
  };

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
      void supabase
        .from("profile_applications")
        .insert({
          user_id: userId,
          firm_name_snapshot: target.name,
          role,
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
          }
        });
    }

    onOpenChange(false);
  };

  const canGenerate = !generating && !loadingUser && !!user && role.trim().length > 0;
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
          {/* CV banner */}
          {user && !user.has_cv && (
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

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest">Role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Legal Internship"
                maxLength={100}
              />
            </div>
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
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest">
              Anything to add (optional)
            </Label>
            <Input
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value.slice(0, 300))}
              placeholder="e.g. available May–July, interested in M&A specifically"
              maxLength={300}
            />
          </div>

          <Button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Drafting…
              </>
            ) : loadingUser ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading your profile…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {hasDraft ? "Regenerate" : "Generate email"}
              </>
            )}
          </Button>

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
