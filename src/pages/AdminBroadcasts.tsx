import { useEffect, useState } from "react";
import { Megaphone, Send, Users, Briefcase, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Segment = "all" | "beta" | "applicants";

interface Broadcast {
  id: string;
  subject: string;
  recipient_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const SEGMENTS: { value: Segment; label: string; icon: typeof Users; hint: string }[] = [
  { value: "all", label: "All users", icon: Users, hint: "Every signed-up Locus user" },
  { value: "beta", label: "Beta testers", icon: Sparkles, hint: "Claimed beta tester slots" },
  { value: "applicants", label: "Active applicants", icon: Briefcase, hint: "Users with ≥1 logged application" },
];

export default function AdminBroadcasts() {
  usePageMeta({ title: "Broadcasts — Admin", description: "Send updates to Locus users.", path: "/admin/broadcasts" });

  const [subject, setSubject] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("update_broadcasts")
      .select("id, subject, recipient_count, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as Broadcast[]) ?? []);
  };

  useEffect(() => { void loadHistory(); }, []);

  const handleSend = async () => {
    if (!subject.trim() || !bodyMarkdown.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    if (!confirm(`Send "${subject}" to ${segment} segment? This cannot be undone.`)) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-broadcast", {
      body: {
        subject: subject.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        segment,
      },
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "Failed to send broadcast");
      return;
    }
    toast.success(`Queued to ${data?.queued ?? 0} recipients`);
    setSubject(""); setBodyMarkdown(""); setCtaLabel(""); setCtaUrl("");
    void loadHistory();
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Outreach</p>
        <h1 className="font-heading text-3xl md:text-4xl font-black flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-accent" /> Broadcasts
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send a one-off update email to a chosen segment. Markdown supported.
        </p>
      </header>

      <section className="border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_hsl(var(--foreground))] mb-10 space-y-5">
        <div>
          <Label className="font-mono text-[10px] uppercase tracking-widest">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's new on Locus this week"
            className="mt-2 border-2 border-foreground"
            maxLength={120}
          />
        </div>

        <div>
          <Label className="font-mono text-[10px] uppercase tracking-widest">
            Body (markdown — **bold**, *italic*, [link](https://...))
          </Label>
          <Textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            placeholder={"We just shipped CV analysis. Try it free this week.\n\nA new **vacancy board** is live too."}
            className="mt-2 border-2 border-foreground min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest">CTA label (optional)</Label>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Try it now" className="mt-2 border-2 border-foreground" />
          </div>
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest">CTA URL (optional)</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://locus.legal/tools" className="mt-2 border-2 border-foreground" />
          </div>
        </div>

        <div>
          <Label className="font-mono text-[10px] uppercase tracking-widest mb-2 block">Segment</Label>
          <div className="grid sm:grid-cols-3 gap-3">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              const active = segment === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSegment(s.value)}
                  className={`text-left border-2 border-foreground p-3 transition-all ${
                    active
                      ? "bg-accent text-accent-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                      : "bg-card hover:translate-y-[-2px]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="font-heading font-extrabold text-sm">{s.label}</span>
                  </div>
                  <p className="text-xs opacity-80">{s.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="border-2 border-foreground bg-accent text-accent-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] font-heading font-extrabold"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 bg-accent" /> Recent broadcasts
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground border-2 border-dashed border-foreground p-6 text-center">
            No broadcasts sent yet.
          </p>
        ) : (
          <div className="border-2 border-foreground bg-card divide-y-2 divide-foreground">
            {history.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-extrabold truncate">{b.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.sent_at ? new Date(b.sent_at).toLocaleString() : "Draft"} · {b.status}
                  </p>
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-right shrink-0">
                  <div className="font-heading text-2xl font-black text-accent leading-none">{b.recipient_count}</div>
                  <div className="text-muted-foreground">recipients</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
