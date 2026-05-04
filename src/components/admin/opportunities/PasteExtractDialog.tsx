import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OppStream = "cfp" | "moot" | "competition";

const FIELDS: Record<OppStream, { key: string; label: string; type?: "textarea" | "url" | "date" | "number" }[]> = {
  cfp: [
    { key: "publication_name", label: "Publication name" },
    { key: "publication_type", label: "Type (journal / blog / magazine / book / conference / other)" },
    { key: "theme", label: "Theme" },
    { key: "submission_deadline", label: "Submission deadline (ISO)", type: "date" },
    { key: "word_limit_min", label: "Min words", type: "number" },
    { key: "word_limit_max", label: "Max words", type: "number" },
    { key: "co_authorship_allowed", label: "Co-authorship? (true/false)" },
    { key: "submission_fee", label: "Submission fee" },
    { key: "submission_url", label: "Submission URL", type: "url" },
    { key: "contact_email", label: "Contact email" },
    { key: "peer_reviewed", label: "Peer reviewed? (true/false)" },
    { key: "eligibility", label: "Eligibility", type: "textarea" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "source_credit", label: "Source credit" },
  ],
  moot: [
    { key: "competition_name", label: "Competition name" },
    { key: "organiser", label: "Organiser" },
    { key: "edition", label: "Edition" },
    { key: "area_of_law", label: "Area of law" },
    { key: "mode", label: "Mode (online / offline / hybrid)" },
    { key: "venue", label: "Venue" },
    { key: "event_start_date", label: "Event start (ISO)", type: "date" },
    { key: "event_end_date", label: "Event end (ISO)", type: "date" },
    { key: "registration_deadline", label: "Registration deadline (ISO)", type: "date" },
    { key: "prize_pool", label: "Prize pool" },
    { key: "registration_url", label: "Registration URL", type: "url" },
    { key: "eligibility", label: "Eligibility", type: "textarea" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "source_credit", label: "Source credit" },
  ],
  competition: [
    { key: "title", label: "Title" },
    { key: "category", label: "Category (essay / research_paper / quiz / debate / negotiation / mediation / client_counseling / arbitration / drafting / hackathon / fellowship / other)" },
    { key: "organiser", label: "Organiser" },
    { key: "deadline", label: "Deadline (ISO)", type: "date" },
    { key: "event_date", label: "Event date (ISO)", type: "date" },
    { key: "mode", label: "Mode (online / offline / hybrid)" },
    { key: "prize_or_stipend", label: "Prize / stipend" },
    { key: "fee", label: "Fee" },
    { key: "application_url", label: "Application URL", type: "url" },
    { key: "eligibility", label: "Eligibility", type: "textarea" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "source_credit", label: "Source credit" },
  ],
};

const TABLE: Record<OppStream, "cfps" | "moots" | "competitions"> = {
  cfp: "cfps",
  moot: "moots",
  competition: "competitions",
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stream: OppStream;
  userId: string;
  onSaved: () => void;
}

export default function PasteExtractDialog({ open, onOpenChange, stream, userId, onSaved }: Props) {
  const [step, setStep] = useState<"paste" | "form">("paste");
  const [pasted, setPasted] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [expiresInDays, setExpiresInDays] = useState(14);

  useEffect(() => {
    if (open) {
      setStep("paste");
      setPasted("");
      setForm({});
      setExpiresInDays(14);
    }
  }, [open, stream]);

  const extract = async () => {
    if (!pasted.trim()) {
      toast.error("Paste the text first.");
      return;
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-opportunity", {
        body: { text: pasted, stream },
      });
      if (error) {
        toast.error(error.message ?? "Extraction failed.");
        return;
      }
      setForm((data ?? {}) as Record<string, any>);
      setStep("form");
      toast.success("Extracted. Review and save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const expires_at = new Date(Date.now() + expiresInDays * 86400000).toISOString();
      const cleaned: Record<string, any> = { ...form };
      // Coerce booleans
      for (const k of Object.keys(cleaned)) {
        if (cleaned[k] === "true") cleaned[k] = true;
        else if (cleaned[k] === "false") cleaned[k] = false;
        else if (cleaned[k] === "") cleaned[k] = null;
      }
      cleaned.created_by = userId;
      cleaned.status = "live";
      cleaned.expires_at = expires_at;

      const { error } = await supabase.from(TABLE[stream]).insert(cleaned);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Posted.");
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const fields = FIELDS[stream];
  const titles: Record<OppStream, string> = { cfp: "Add CFP", moot: "Add Moot", competition: "Add Competition" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-heading">{titles[stream]}</DialogTitle>
          <DialogDescription>
            {step === "paste"
              ? "Paste the raw post — Locus AI will extract structured fields."
              : "Review and adjust before publishing."}
          </DialogDescription>
        </DialogHeader>

        {step === "paste" ? (
          <div className="space-y-3">
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={10}
              placeholder="Paste the call/notice text here…"
              className="border-2 border-foreground"
            />
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("form")}>Skip — fill manually</Button>
              <Button
                onClick={extract}
                disabled={extracting || !pasted.trim()}
                className="font-bold border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
              >
                {extracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Extract
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label className="text-xs">{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="border-2 border-foreground"
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="border-2 border-foreground"
                    />
                  )}
                </div>
              ))}
              <div>
                <Label className="text-xs">Live for (days, max 60)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value) || 14)}
                  className="border-2 border-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("paste")}>Back</Button>
              <Button
                onClick={submit}
                disabled={saving}
                className="font-bold border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Publish
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
