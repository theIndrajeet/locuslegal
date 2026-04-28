import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You extract structured legal-internship vacancy details from messy raw text shared by a curator (often a screenshot OCR, a WhatsApp forward, or a LinkedIn post).

CRITICAL:
- Output ONLY via the provided extract_vacancy tool.
- application_email is REQUIRED. If the source has no email address (only a form link, only a phone number, only "DM us"), set application_email to "" — the admin UI will reject it.
- Do NOT invent or guess an email. Pick only what's literally in the text.
- firm_name and role are required. If unclear, infer the cleanest short version.
- description: keep the freeform body the curator wrote (instructions, eligibility specifics, deadlines mentioned in prose). Strip emojis. Strip "DM me", "comment 'interested'", or any non-email instructions. Max 800 chars.
- eligibility: a one-line summary like "3rd-5th year, NLU only" or "All law students" — null if not specified.
- stipend: free-form, null if not stated.
- location: city only, null if remote/unspecified.
- source_credit: capture an attribution like "via @handle" or "shared by Jane" if present, else null.

Return JSON only via the tool.`;

interface ExtractInput { text: string }

function validate(b: unknown): { ok: true; data: ExtractInput } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "invalid body" };
  const t = (b as { text?: unknown }).text;
  if (typeof t !== "string" || !t.trim()) return { ok: false, error: "text required" };
  if (t.length > 8000) return { ok: false, error: "text too long (max 8000 chars)" };
  return { ok: true, data: { text: t } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userRes?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin gate
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json().catch(() => null);
    const v = validate(raw);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `RAW SOURCE TEXT:\n\n${v.data.text}\n\nExtract via the extract_vacancy tool.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_vacancy",
            description: "Return structured vacancy fields.",
            parameters: {
              type: "object",
              properties: {
                firm_name: { type: "string" },
                role: { type: "string" },
                location: { type: ["string", "null"] },
                application_email: { type: "string", description: "Empty string if none found." },
                eligibility: { type: ["string", "null"] },
                stipend: { type: ["string", "null"] },
                description: { type: ["string", "null"] },
                source_credit: { type: ["string", "null"] },
              },
              required: ["firm_name", "role", "application_email"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_vacancy" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned nothing." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(toolCall.function.arguments); }
    catch { return new Response(JSON.stringify({ error: "Malformed AI response." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    }); }

    const clean = (s: unknown, max: number) => {
      if (s === null || s === undefined) return null;
      const t = String(s).trim();
      return t ? t.slice(0, max) : null;
    };

    return new Response(JSON.stringify({
      firm_name: clean(parsed.firm_name, 200) ?? "",
      role: clean(parsed.role, 200) ?? "",
      location: clean(parsed.location, 100),
      application_email: clean(parsed.application_email, 200) ?? "",
      eligibility: clean(parsed.eligibility, 200),
      stipend: clean(parsed.stipend, 100),
      description: clean(parsed.description, 800),
      source_credit: clean(parsed.source_credit, 100),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-vacancy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
