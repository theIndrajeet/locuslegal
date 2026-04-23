// "Reason It Through" — post-answer tutor chat panel.
// Easter egg: the short form "Rit" is dedicated to someone special. ✦

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Sparkles, Send, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RitMessage } from "./RitMessage";
import { RitStarterChip } from "./RitStarterChip";
import { RitGlitchTitle } from "./RitGlitchTitle";
import { cn } from "@/lib/utils";

const MAX_MESSAGES = 20;
const STARTERS = [
  "Why isn't my answer correct?",
  "Cite the leading case",
  "Give me a similar hypothetical",
];

interface RitMsg {
  role: "user" | "assistant";
  content: string;
  id?: string;
  created_at?: string;
}

interface Props {
  attemptId: string;
  challenge: {
    title?: string | null;
    question_type?: string | null;
    correct_answer_summary?: string | null;
  };
  /**
   * Optional pre-computed greeting. If absent, falls back to a generic line.
   */
  greeting?: string;
  /** Default open state (closed by default) */
  defaultOpen?: boolean;
  /** Demo mode: skip DB/edge function, use canned replies. Used on the preview page. */
  demoMode?: boolean;
  /** Canned replies keyed by message text (case-insensitive exact match). */
  demoReplies?: Record<string, string>;
}

const DEMO_FALLBACK =
  "In the live version I'd reason this through with you using your actual question and answer. This is a static demo — try one of the chips above to see Rit in action.";

export function RitChatPanel({ attemptId, challenge, greeting, defaultOpen = false, demoMode = false, demoReplies }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<RitMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hiddenCleared, setHiddenCleared] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const computedGreeting = useMemo(() => {
    if (greeting && greeting.trim().length > 0) return greeting;
    const summary = challenge.correct_answer_summary?.trim();
    if (summary) {
      return `Hi — I'm here to help you reason this through. ${summary}. What part would you like to dig into?`;
    }
    return "Hi — I'm here to help you reason this through. What part of the question would you like to explore?";
  }, [greeting, challenge.correct_answer_summary]);

  // Load history on first expand (skipped in demo mode)
  useEffect(() => {
    if (!open || loaded) return;
    if (demoMode) {
      setLoaded(true);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("bar_rit_messages" as any)
        .select("id, role, content, created_at")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("rit history load error", error);
      }
      setMessages((data ?? []) as unknown as RitMsg[]);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [open, loaded, attemptId, demoMode]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, open]);

  const visibleMessages = hiddenCleared ? [] : messages;
  const messageCount = visibleMessages.length;
  const capReached = messageCount >= MAX_MESSAGES;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || capReached) return;
    if (trimmed.length > 1500) {
      toast.error("Please keep messages under 1500 characters.");
      return;
    }

    setSending(true);
    setInput("");
    setHiddenCleared(false);
    // optimistic user bubble
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    if (demoMode) {
      // Simulated typing delay + canned reply lookup
      const lookup = demoReplies ?? {};
      const key = Object.keys(lookup).find(
        (k) => k.toLowerCase() === trimmed.toLowerCase()
      );
      const reply = key ? lookup[key] : DEMO_FALLBACK;
      await new Promise((r) => setTimeout(r, 1200));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setSending(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("rit-chat", {
        body: { attempt_id: attemptId, message: trimmed },
      });
      if (error) {
        const ctx = (error as any).context;
        let parsed: any = null;
        try { if (ctx?.json) parsed = await ctx.json(); } catch { /* ignore */ }
        const friendly = parsed?.message
          ?? (parsed?.error === "rate_limited"
            ? "Rit is taking a breather — try again in a moment."
            : parsed?.error === "credits_exhausted"
            ? "Rit is out of credits. Please add funds in Settings."
            : "Rit couldn't reply. Please try again.");
        toast.error(friendly);
        // rollback optimistic message
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      const reply = (data as any)?.reply as string | undefined;
      if (!reply) {
        toast.error("Rit couldn't reply. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("rit-chat invoke fail", e);
      toast.error("Network error. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Card className="border-2 border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-md border-2 border-border bg-accent/15 flex items-center justify-center">
          <MessageSquare size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-extrabold font-heading text-foreground">Reason It Through</div>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-accent text-accent">Rit</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {open ? "Debate the answer, ask follow-ups, or dig deeper." : "Still curious? Tap to open the tutor."}
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t-2 border-border">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border text-[11px] text-muted-foreground">
            <span>{messageCount} / {MAX_MESSAGES} messages</span>
            {messageCount > 0 && (
              <button
                type="button"
                onClick={() => setHiddenCleared(true)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Trash2 size={11} /> Clear conversation
              </button>
            )}
          </div>

          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto p-4 space-y-3">
            {/* Greeting (always shown, not counted toward cap) */}
            <RitMessage role="assistant" content={computedGreeting} />

            {visibleMessages.map((m, i) => (
              <RitMessage key={m.id ?? i} role={m.role} content={m.content} />
            ))}

            {visibleMessages.length === 0 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <RitStarterChip key={s} label={s} onClick={() => send(s)} disabled={sending} />
                ))}
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                <Loader2 size={12} className="animate-spin" />
                Rit is thinking…
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            {capReached ? (
              <div className="text-center text-xs text-muted-foreground py-2">
                You've reached the conversation limit for this challenge. Try a fresh challenge to keep reasoning.
              </div>
            ) : (
              <>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask Rit anything about this question…"
                  rows={2}
                  maxLength={1500}
                  disabled={sending}
                  className={cn("resize-none text-sm")}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Enter to send · Shift+Enter for newline
                  </span>
                  <Button
                    size="sm"
                    onClick={() => send(input)}
                    disabled={sending || input.trim().length === 0}
                    className="gap-1.5"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
