import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, Eye, ShieldOff, History, TestTube2, Trash2, Pencil, Wrench } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePageMeta } from "@/hooks/usePageMeta";

interface BroadcastRow {
  id: string;
  subject: string;
  body_markdown: string;
  preheader: string | null;
  cta_label: string | null;
  cta_url: string | null;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
}

function renderMarkdown(md: string): string {
  const raw = marked.parse(md || "", { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      "p","br","strong","em","u","a","ul","ol","li","blockquote",
      "h1","h2","h3","h4","code","pre","hr","img"
    ],
    ALLOWED_ATTR: ["href","target","rel","src","alt","title"],
  });
}

export default function AdminUpdates() {
  const isAdmin = useAdminRole();
  const { userId } = useAuthSession();

  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<BroadcastRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: "Admin · Updates — Locus",
    description: "Compose and send product updates to all Locus users.",
  });

  const bodyHtml = useMemo(() => renderMarkdown(bodyMd), [bodyMd]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("update_broadcasts")
      .select("id, subject, body_markdown, preheader, cta_label, cta_url, status, recipient_count, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && data) setHistory(data as BroadcastRow[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (isAdmin) loadHistory();
  }, [isAdmin]);

  const reset = () => {
    setSubject(""); setPreheader(""); setBodyMd(""); setCtaLabel(""); setCtaUrl("");
  };

  // Insert a draft broadcast row, return its id.
  const createDraft = async (): Promise<string | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("update_broadcasts")
      .insert({
        subject: subject.trim(),
        body_markdown: bodyMd,
        body_html: bodyHtml,
        preheader: preheader.trim() || null,
        cta_label: ctaLabel.trim() || null,
        cta_url: ctaUrl.trim() || null,
        status: "draft",
        created_by: userId,
      })
      .select("id")
      .maybeSingle();
    if (error || !data) {
      toast({ title: "Could not save broadcast", description: error?.message, variant: "destructive" });
      return null;
    }
    return data.id as string;
  };

  const validate = (): string | null => {
    if (!subject.trim()) return "Subject is required.";
    if (!bodyMd.trim()) return "Body is required.";
    if (ctaUrl.trim() && !ctaLabel.trim()) return "CTA label is required when CTA URL is set.";
    if (ctaLabel.trim() && !ctaUrl.trim()) return "CTA URL is required when CTA label is set.";
    return null;
  };

  // Low-level dispatcher: invoke the edge function for an existing broadcast id.
  const dispatchBroadcast = async (id: string, testEmail?: string) => {
    const { data, error } = await supabase.functions.invoke("dispatch-updates-broadcast", {
      body: testEmail ? { broadcastId: id, testEmail } : { broadcastId: id },
    });
    if (error) throw error;
    if (data && (data as any).ok === false) {
      throw new Error((data as any).error || "Send failed");
    }
    return data as any;
  };

  const handleTestSend = async () => {
    const err = validate();
    if (err) { toast({ title: err, variant: "destructive" }); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const myEmail = u?.user?.email;
      if (!myEmail) {
        toast({ title: "Cannot resolve your email", variant: "destructive" });
        return;
      }
      const id = await createDraft();
      if (!id) return;
      await dispatchBroadcast(id, myEmail);
      toast({
        title: `Test sent to ${myEmail}`,
        description: "Check your inbox in a few seconds.",
      });
      await loadHistory();
    } catch (e: any) {
      toast({ title: "Test send failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleSendAll = async () => {
    const err = validate();
    if (err) { toast({ title: err, variant: "destructive" }); return; }
    setBusy(true);
    try {
      const id = await createDraft();
      if (!id) return;
      const data = await dispatchBroadcast(id);
      const queued = data?.queued ?? 0;
      const skipped = data?.suppressed_skipped ?? 0;
      toast({
        title: `Broadcast queued`,
        description: `Sending to ${queued} recipients (${skipped} suppressed/skipped).`,
      });
      reset();
      await loadHistory();
    } catch (e: any) {
      toast({ title: "Broadcast failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Row actions on existing broadcasts.
  const loadIntoComposer = (b: BroadcastRow) => {
    setSubject(b.subject || "");
    setPreheader(b.preheader || "");
    setBodyMd(b.body_markdown || "");
    setCtaLabel(b.cta_label || "");
    setCtaUrl(b.cta_url || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast({ title: "Loaded into composer", description: "Edit and re-send as a fresh draft." });
  };

  const testExistingDraft = async (id: string) => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const myEmail = u?.user?.email;
      if (!myEmail) {
        toast({ title: "Cannot resolve your email", variant: "destructive" });
        return;
      }
      await dispatchBroadcast(id, myEmail);
      toast({ title: `Test sent to ${myEmail}`, description: "Check your inbox in a few seconds." });
      await loadHistory();
    } catch (e: any) {
      toast({ title: "Test send failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendExistingToAll = async (id: string) => {
    setBusy(true);
    try {
      const data = await dispatchBroadcast(id);
      const queued = data?.queued ?? 0;
      const skipped = data?.suppressed_skipped ?? 0;
      toast({
        title: `Broadcast queued`,
        description: `Sending to ${queued} recipients (${skipped} suppressed/skipped).`,
      });
      await loadHistory();
    } catch (e: any) {
      toast({ title: "Broadcast failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deleteBroadcast = async (id: string) => {
    const { error } = await supabase.from("update_broadcasts").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else loadHistory();
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-2 border-border space-y-4">
          <div className="flex justify-center"><ShieldOff className="w-12 h-12 text-destructive" /></div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have admin access to this page.</p>
          <Button asChild><Link to="/">Back to Home</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 container mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Updates Broadcast</h1>
        <p className="text-muted-foreground mt-1">
          Send a one-off product or feature update to every signed-up user
          and every waitlist email (deduped, suppressed addresses skipped).
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card className="p-6 border-2 border-border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">Compose</h2>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="What's new in Locus" maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preheader">Preheader (preview text)</Label>
            <Input id="preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)}
              placeholder="Optional — shown next to the subject in inboxes" maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body (Markdown supported) *</Label>
            <Textarea id="body" value={bodyMd} onChange={(e) => setBodyMd(e.target.value)}
              rows={10} placeholder={"Hey there,\n\nThis week we shipped..."} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cta-label">CTA label</Label>
              <Input id="cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Read more" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-url">CTA URL</Label>
              <Input id="cta-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://locus.legal/..." />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={handleTestSend} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube2 className="w-4 h-4 mr-2" />}
              Send test to me
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={busy}>
                  <Send className="w-4 h-4 mr-2" /> Send to all users
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send to all users + waitlist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will queue an email to every signed-up Locus user
                    AND every email on the waitlist (deduped, suppressed
                    addresses skipped). You can't unsend after this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSendAll}>Send broadcast</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6 border-2 border-border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> Live preview</h2>
          <div className="bg-white text-black border-2 border-black rounded p-6 shadow-[4px_4px_0_#000]">
            <div className="text-2xl font-extrabold mb-1" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              Loc<span className="text-yellow-400">us</span>
            </div>
            <h3 className="text-xl font-extrabold mt-4 mb-3" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              {subject || "Subject preview"}
            </h3>
            <div
              ref={previewRef}
              className="prose prose-sm max-w-none text-black [&_a]:text-black [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: bodyHtml || "<p class='text-neutral-400'>Body preview…</p>" }}
            />
            {ctaUrl && ctaLabel ? (
              <div className="mt-5">
                <span className="inline-block bg-yellow-400 text-black border-2 border-black font-bold px-5 py-2 shadow-[3px_3px_0_#000]">
                  {ctaLabel}
                </span>
              </div>
            ) : null}
            <hr className="my-6 border-neutral-200" />
            <p className="text-xs text-neutral-500">
              Footer with unsubscribe link is added automatically when sending.
            </p>
          </div>
        </Card>
      </div>

      {/* History */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Recent broadcasts
        </h2>
        <Card className="border-2 border-border overflow-hidden">
          {loadingHistory ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No broadcasts yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((b) => (
                <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{b.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(b.created_at).toLocaleString()} ·
                      {" "}<span className="uppercase">{b.status}</span>
                      {b.status === "sent" ? ` · ${b.recipient_count} recipients` : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => loadIntoComposer(b)}
                      title="Load into composer"
                      aria-label="Load into composer"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {b.status === "draft" && (
                      <>
                        <Button
                          variant="ghost" size="sm"
                          disabled={busy}
                          onClick={() => testExistingDraft(b.id)}
                          title="Send test to me"
                          aria-label="Send test to me"
                        >
                          <TestTube2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost" size="sm"
                              disabled={busy}
                              title="Send to all users"
                              aria-label="Send to all users"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send "{b.subject}" to all users + waitlist?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will queue this draft to every signed-up Locus user
                                AND every email on the waitlist (deduped, suppressed
                                addresses skipped). You can't unsend after this.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => sendExistingToAll(b.id)}>
                                Send broadcast
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => deleteBroadcast(b.id)}
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
