// Admin-only email log reader. Returns deduped rows from email_send_log
// (latest status per message_id), plus summary stats and template list.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  rangeDays?: number;
  template?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const admin = createClient(url, service);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const body = (await req.json().catch(() => ({}))) as Body;
    const rangeDays = Math.min(Math.max(body.rangeDays ?? 7, 1), 90);
    const template = body.template ?? null;
    const status = body.status ?? null;
    const limit = Math.min(Math.max(body.limit ?? 50, 1), 200);
    const offset = Math.max(body.offset ?? 0, 0);
    const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

    // Pull a generous window then dedupe in memory by message_id (latest).
    // For our scale (low volume), this is simpler than a SQL view.
    const { data: rawRows, error } = await admin
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, metadata, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) return json({ error: error.message }, 500);

    const seen = new Set<string>();
    const deduped = [] as typeof rawRows;
    for (const r of rawRows ?? []) {
      const key = r.message_id ?? r.id;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
    }

    let filtered = deduped;
    if (template) filtered = filtered.filter((r) => r.template_name === template);
    if (status) filtered = filtered.filter((r) => r.status === status);

    const stats = {
      total: filtered.length,
      sent: filtered.filter((r) => r.status === "sent").length,
      failed: filtered.filter((r) => ["dlq", "failed", "bounced"].includes(r.status)).length,
      suppressed: filtered.filter((r) => r.status === "suppressed").length,
      pending: filtered.filter((r) => r.status === "pending").length,
    };

    const templates = Array.from(new Set((deduped ?? []).map((r) => r.template_name))).sort();
    const page = filtered.slice(offset, offset + limit);

    return json({ rows: page, total: filtered.length, stats, templates });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
