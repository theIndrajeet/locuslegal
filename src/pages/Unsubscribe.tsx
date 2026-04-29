import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, MailX, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State =
  | { kind: "loading" }
  | { kind: "ready"; email: string }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "done"; email: string }
  | { kind: "error"; message: string };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>({ kind: "loading" });

  usePageMeta({
    title: "Unsubscribe — Locus",
    description: "Manage your email preferences for Locus.",
  });

  useEffect(() => {
    if (!token) { setState({ kind: "invalid" }); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data?.reason === "already_unsubscribed") setState({ kind: "already" });
          else setState({ kind: "invalid" });
          return;
        }
        if (data?.already_unsubscribed) {
          setState({ kind: "already" });
        } else {
          setState({ kind: "ready", email: data?.email || "your address" });
        }
      } catch (e: any) {
        setState({ kind: "error", message: e?.message ?? "Network error" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (state.kind !== "ready") return;
    const email = state.email;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
          body: JSON.stringify({ token }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ kind: "error", message: data?.error || "Could not unsubscribe." });
        return;
      }
      setState({ kind: "done", email });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Network error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="max-w-md w-full p-8 border-2 border-border space-y-5 shadow-[4px_4px_0_hsl(var(--foreground))]">
        <div className="flex items-center gap-3">
          <MailX className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold">Unsubscribe from Locus emails</h1>
        </div>

        {state.kind === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying your link…
          </div>
        )}

        {state.kind === "invalid" && (
          <>
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p>This unsubscribe link is invalid or has expired.</p>
            </div>
            <Button asChild variant="outline"><Link to="/">Back to Locus</Link></Button>
          </>
        )}

        {state.kind === "already" && (
          <>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p>You're already unsubscribed from Locus update emails.</p>
            </div>
            <Button asChild variant="outline"><Link to="/">Back to Locus</Link></Button>
          </>
        )}

        {state.kind === "ready" && (
          <>
            <p className="text-sm text-muted-foreground">
              Confirm to stop receiving update emails at <span className="font-semibold text-foreground">{state.email}</span>.
              You'll still receive essential account emails (password resets, verification).
            </p>
            <div className="flex gap-3">
              <Button onClick={confirm}>Confirm unsubscribe</Button>
              <Button asChild variant="outline"><Link to="/">Cancel</Link></Button>
            </div>
          </>
        )}

        {state.kind === "submitting" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Unsubscribing…
          </div>
        )}

        {state.kind === "done" && (
          <>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p>You're unsubscribed. We won't send update emails to <span className="font-semibold">{state.email}</span> anymore.</p>
            </div>
            <Button asChild variant="outline"><Link to="/">Back to Locus</Link></Button>
          </>
        )}

        {state.kind === "error" && (
          <>
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p>{state.message}</p>
            </div>
            <Button asChild variant="outline"><Link to="/">Back to Locus</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
