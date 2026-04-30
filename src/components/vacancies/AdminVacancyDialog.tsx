import { useEffect, useState } from "react";
import { Loader2, Sparkles, AlertTriangle, GraduationCap, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Vacancy, type VacancyOpportunityType } from "@/lib/vacancies";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Vacancy | null; // when present → edit mode
  onSaved: () => void;
  userId: string;
}

interface FormState {
  firm_name: string;
  role: string;
  opportunity_type: VacancyOpportunityType;
  location: string;
  application_email: string;
  eligibility: string;
  stipend: string;
  description: string;
  task_brief: string;
  source_credit: string;
  expires_in_days: number;
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const blank = (): FormState => ({
  firm_name: "", role: "", opportunity_type: "internship", location: "", application_email: "",
  eligibility: "", stipend: "", description: "", task_brief: "", source_credit: "",
  expires_in_days: 5,
});

export default function AdminVacancyDialog({ open, onOpenChange, initial, onSaved, userId }: Props) {
  const [step, setStep] = useState<"paste" | "form">("paste");
  const [pasted, setPasted] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(blank());

  const editMode = !!initial;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const remainingMs = new Date(initial.expires_at).getTime() - Date.now();
      const days = Math.max(1, Math.ceil(remainingMs / 86400000));
      setForm({
        firm_name: initial.firm_name,
        role: initial.role,
        opportunity_type: initial.opportunity_type ?? "internship",
        location: initial.location ?? "",
        application_email: initial.application_email,
        eligibility: initial.eligibility ?? "",
        stipend: initial.stipend ?? "",
        description: initial.description ?? "",
        task_brief: initial.task_brief ?? "",
        source_credit: initial.source_credit ?? "",
        expires_in_days: days,
      });
      setStep("form");
      setPasted("");
    } else {
      setForm(blank());
      setStep("paste");
      setPasted("");
    }
  }, [open, initial]);

  const extract = async () => {
    if (!pasted.trim()) {
      toast.error("Paste the vacancy text first.");
      return;
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-vacancy", { body: { text: pasted } });
      if (error) {
        toast.error(error.message ?? "Couldn't extract.");
        return;
      }
      const d = data as Partial<FormState> & { application_email?: string; opportunity_type?: string };
      const detectedType: VacancyOpportunityType = d.opportunity_type === "job" ? "job" : "internship";
      setForm((f) => ({
        ...f,
        firm_name: d.firm_name ?? "",
        role: d.role ?? "",
        opportunity_type: detectedType,
        location: d.location ?? "",
        application_email: d.application_email ?? "",
        eligibility: d.eligibility ?? "",
        stipend: d.stipend ?? "",
        description: d.description ?? "",
        task_brief: d.task_brief ?? "",
        source_credit: d.source_credit ?? "",
      }));
      setStep("form");
      const typeLabel = detectedType === "job" ? "Job" : "Internship";
      const taskNote = d.task_brief && d.task_brief.trim() ? " A written task was detected." : "";
      if (!d.application_email || !EMAIL_RE.test(d.application_email)) {
        toast.warning(`Detected as ${typeLabel}.${taskNote} No valid email found — add one manually or reject.`);
      } else {
        toast.success(`Detected as ${typeLabel}.${taskNote} Review and save.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const submit = async () => {
    const email = form.application_email.trim().toLowerCase();
    if (!form.firm_name.trim() || !form.role.trim()) {
      toast.error("Firm name and role are required.");
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      toast.error("This vacancy needs a valid application email — direct-link postings are not accepted.");
      return;
    }
    const days = Math.max(1, Math.min(14, form.expires_in_days || 5));
    setSaving(true);
    try {
      if (editMode && initial) {
        const expires_at = new Date(Date.now() + days * 86400000).toISOString();
        const { error } = await supabase
          .from("vacancies")
          .update({
            firm_name: form.firm_name.trim(),
            role: form.role.trim(),
            opportunity_type: form.opportunity_type,
            location: form.location.trim() || null,
            application_email: email,
            eligibility: form.eligibility.trim() || null,
            stipend: form.stipend.trim() || null,
            description: form.description.trim() || null,
            task_brief: form.task_brief.trim() || null,
            source_credit: form.source_credit.trim() || null,
            expires_at,
          })
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Vacancy updated.");
      } else {
        const now = new Date();
        const expires_at = new Date(now.getTime() + days * 86400000).toISOString();
        const { error } = await supabase.from("vacancies").insert({
          firm_name: form.firm_name.trim(),
          role: form.role.trim(),
          opportunity_type: form.opportunity_type,
          location: form.location.trim() || null,
          application_email: email,
          eligibility: form.eligibility.trim() || null,
          stipend: form.stipend.trim() || null,
          description: form.description.trim() || null,
          task_brief: form.task_brief.trim() || null,
          source_credit: form.source_credit.trim() || null,
          posted_at: now.toISOString(),
          expires_at,
          created_by: userId,
        });
        if (error) throw error;
        toast.success("Vacancy posted.");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      if (msg.includes("application_email_required")) toast.error("Application email is required.");
      else if (msg.includes("application_email_invalid")) toast.error("That email isn't valid.");
      else if (msg.includes("expiry_must_be_after_posted")) toast.error("Expiry must be in the future.");
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const emailValid = !form.application_email || EMAIL_RE.test(form.application_email.trim().toLowerCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <Sparkles size={18} className="text-accent" />
            {editMode ? "Edit vacancy" : step === "paste" ? "Add vacancy — paste source" : "Review & post vacancy"}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? "Update fields. Expiry is calculated forward from now."
              : step === "paste"
                ? "Paste the raw posting (WhatsApp forward, screenshot OCR, LinkedIn copy). AI will fill the form."
                : "Verify every field. The application email is required — postings without one get rejected."}
          </DialogDescription>
        </DialogHeader>

        {step === "paste" && !editMode ? (
          <>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste the vacancy text here…"
              className="min-h-[220px] font-mono text-xs"
              maxLength={8000}
            />
            <p className="text-xs text-muted-foreground mt-1">{pasted.length} / 8000 characters</p>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setStep("form")}>
                Skip — fill manually
              </Button>
              <Button onClick={extract} disabled={extracting || !pasted.trim()}>
                {extracting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                Extract with AI
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label>Type *</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["internship", "job"] as const).map((t) => {
                    const Icon = t === "internship" ? GraduationCap : Briefcase;
                    const active = form.opportunity_type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("opportunity_type", t)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-md border-2 font-bold text-sm uppercase tracking-wide transition-all",
                          active
                            ? "border-foreground bg-accent text-accent-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/60",
                        )}
                      >
                        <Icon size={14} />
                        {t === "internship" ? "Internship" : "Job"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Firm name *</Label>
                  <Input value={form.firm_name} onChange={(e) => update("firm_name", e.target.value)} />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Input value={form.role} onChange={(e) => update("role", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Application email *</Label>
                <Input
                  type="email"
                  value={form.application_email}
                  onChange={(e) => update("application_email", e.target.value)}
                  className={!emailValid ? "border-destructive" : ""}
                />
                {!emailValid && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Required. Vacancies without a real application email are not posted.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Mumbai" />
                </div>
                <div>
                  <Label>Stipend</Label>
                  <Input value={form.stipend} onChange={(e) => update("stipend", e.target.value)} placeholder="₹15k/mo" />
                </div>
                <div>
                  <Label>Expires in (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    value={form.expires_in_days}
                    onChange={(e) => update("expires_in_days", parseInt(e.target.value || "5", 10))}
                  />
                </div>
              </div>

              <div>
                <Label>Eligibility</Label>
                <Input
                  value={form.eligibility}
                  onChange={(e) => update("eligibility", e.target.value)}
                  placeholder="3rd-5th year, NLU only"
                />
              </div>

              <div>
                <Label>Description / instructions</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="min-h-[120px]"
                  placeholder="What the post says — application instructions, CV requirements, subject line, etc."
                  maxLength={800}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.description.length} / 800</p>
              </div>

              <div>
                <Label>Source credit (optional)</Label>
                <Input
                  value={form.source_credit}
                  onChange={(e) => update("source_credit", e.target.value)}
                  placeholder="via @somehandle"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              {!editMode && (
                <Button variant="ghost" onClick={() => setStep("paste")}>
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving || !emailValid}>
                {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                {editMode ? "Save changes" : "Post vacancy"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
