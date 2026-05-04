import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Stream = "cfp" | "moot" | "competition";

const SYSTEMS: Record<Stream, string> = {
  cfp: `Extract a Call-for-Papers from raw text. Output ONLY via the tool.
- publication_name: required (e.g. "NLSIR Vol 38" or the symposium / journal name).
- publication_type: one of journal | blog | magazine | other.
- theme: short topic, null if generic.
- submission_deadline: ISO datetime. CRITICAL: if the post lists multiple dates (registration, abstract, presentation, full paper), pick the ABSTRACT submission deadline (or the headline submission deadline when there is no abstract stage). Do NOT pick the registration date or the presentation/event date. If only a date is given, use end-of-day UTC (T23:59:59Z).
- word_limit_min / word_limit_max: integers (use the abstract limits if both abstract and full paper limits are given), null if absent.
- co_authorship_allowed: boolean (default false if unclear).
- submission_fee: free-form string (e.g. "Free", "INR 500"), null if unspecified.
- peer_reviewed: boolean (default false).
- eligibility: one-line, null if not stated.
- submission_url: REQUIRED if any registration/submission URL appears anywhere in the text (Google Forms, microsite, Drive form). NEVER null when a URL is present.
- brochure_url: link to a PDF brochure or Drive brochure ("Click here for Brochure", "Download brochure"). Null only if absent.
- contact_email: only what's literally in the text.
- description: cleaned freeform body, max 800 chars.
- source_credit: "via @x" attribution if present, else null.`,
  moot: `Extract a Moot Court / advocacy competition from raw text. Output ONLY via the tool.
- competition_name: required.
- organiser: required.
- edition: e.g. "12th", null if absent.
- area_of_law: short string, null if absent.
- mode: one of online | offline | hybrid (default offline).
- event_start_date / event_end_date: YYYY-MM-DD or null.
- registration_deadline: ISO datetime. This is the REGISTRATION CLOSE date, not the event date or memorial date. End-of-day UTC if date-only.
- venue: city/place, null if online.
- prize_pool: free-form, null if unspecified.
- eligibility: one-line, null if not stated.
- registration_url: REQUIRED if any registration/application URL appears in the text. NEVER null when a URL is present.
- brochure_url: link to PDF brochure or Drive brochure. Null only if absent.
- description: cleaned freeform body, max 800 chars.
- source_credit: attribution, else null.`,
  competition: `Extract a legal competition (essay/quiz/research/policy/case-study/etc.) from raw text. Output ONLY via the tool.
- title: required.
- organiser: required.
- category: one of essay | quiz | research_paper | policy | case_study | negotiation | mediation | client_counselling | hackathon | debate | drafting | other.
- deadline: ISO datetime. This is the PRIMARY submission/application deadline, not the event date. End-of-day UTC if date-only.
- event_date: YYYY-MM-DD or null.
- mode: online | offline | hybrid or null.
- prize_or_stipend: free-form, null if unspecified.
- fee: free-form, null if unspecified.
- eligibility: one-line, null if not stated.
- application_url: REQUIRED if any application URL appears in the text. NEVER null when a URL is present.
- brochure_url: link to PDF brochure or Drive brochure. Null only if absent.
- description: cleaned body, max 800 chars.
- source_credit: attribution, else null.`,
};

const TOOLS: Record<Stream, any> = {
  cfp: {
    name: "extract_cfp",
    parameters: {
      type: "object",
      properties: {
        publication_name: { type: "string" },
        publication_type: { type: "string", enum: ["journal", "blog", "magazine", "other"] },
        theme: { type: ["string", "null"] },
        submission_deadline: { type: "string" },
        word_limit_min: { type: ["integer", "null"] },
        word_limit_max: { type: ["integer", "null"] },
        co_authorship_allowed: { type: "boolean" },
        submission_fee: { type: ["string", "null"] },
        peer_reviewed: { type: "boolean" },
        eligibility: { type: ["string", "null"] },
        submission_url: { type: ["string", "null"] },
        brochure_url: { type: ["string", "null"] },
        contact_email: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
        source_credit: { type: ["string", "null"] },
      },
      required: ["publication_name", "publication_type", "submission_deadline"],
      additionalProperties: false,
    },
  },
  moot: {
    name: "extract_moot",
    parameters: {
      type: "object",
      properties: {
        competition_name: { type: "string" },
        organiser: { type: "string" },
        edition: { type: ["string", "null"] },
        area_of_law: { type: ["string", "null"] },
        mode: { type: "string", enum: ["online", "offline", "hybrid"] },
        event_start_date: { type: ["string", "null"] },
        event_end_date: { type: ["string", "null"] },
        registration_deadline: { type: "string" },
        venue: { type: ["string", "null"] },
        prize_pool: { type: ["string", "null"] },
        eligibility: { type: ["string", "null"] },
        registration_url: { type: ["string", "null"] },
        brochure_url: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
        source_credit: { type: ["string", "null"] },
      },
      required: ["competition_name", "organiser", "registration_deadline"],
      additionalProperties: false,
    },
  },
  competition: {
    name: "extract_competition",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        organiser: { type: "string" },
        category: { type: "string", enum: ["essay", "quiz", "research_paper", "policy", "case_study", "negotiation", "mediation", "client_counselling", "hackathon", "debate", "drafting", "other"] },
        deadline: { type: "string" },
        event_date: { type: ["string", "null"] },
        mode: { type: ["string", "null"], enum: ["online", "offline", "hybrid", null] },
        prize_or_stipend: { type: ["string", "null"] },
        fee: { type: ["string", "null"] },
        eligibility: { type: ["string", "null"] },
        application_url: { type: ["string", "null"] },
        brochure_url: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
        source_credit: { type: ["string", "null"] },
      },
      required: ["title", "organiser", "category", "deadline"],
      additionalProperties: false,
    },
  },
};

const URL_FIELD: Record<Stream, string> = {
  cfp: "submission_url",
  moot: "registration_url",
  competition: "application_url",
};

function findUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return matches.map((u) => u.replace(/[.,;)]+$/, ""));
}

function isLikelyBrochure(url: string): boolean {
  const u = url.toLowerCase();
  return u.endsWith(".pdf") || u.includes("brochure") || u.includes("drive.google.com") || u.includes("/file/d/");
}

function isLikelyForm(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("docs.google.com/forms") || u.includes("forms.gle") || u.includes("/viewform") ||
    u.includes("typeform") || u.includes("airtable") || u.includes("apply") || u.includes("register");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes } = await authClient.auth.getUser(token);
    if (!userRes?.user?.id) return json({ error: "Unauthorized" }, 401);

    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await adminClient
      .from("user_roles").select("role")
      .eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => null) as { stream?: Stream; text?: string } | null;
    const stream = body?.stream;
    const text = body?.text;
    if (!stream || !["cfp", "moot", "competition"].includes(stream)) return json({ error: "stream required" }, 400);
    if (!text || typeof text !== "string" || !text.trim()) return json({ error: "text required" }, 400);
    if (text.length > 8000) return json({ error: "text too long" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tool = TOOLS[stream];
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEMS[stream] },
          { role: "user", content: `RAW TEXT:\n\n${text}\n\nExtract via the ${tool.name} tool.` },
        ],
        tools: [{ type: "function", function: { name: tool.name, description: `Extract ${stream} fields`, parameters: tool.parameters } }],
        tool_choice: { type: "function", function: { name: tool.name } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit exceeded." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "AI returned nothing." }, 500);
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(args); }
    catch { return json({ error: "Malformed AI response." }, 500); }

    // Server-side URL fallback: scan raw text for URLs and assign brochure/submission if AI missed them.
    const urls = findUrls(text);
    if (urls.length) {
      const urlField = URL_FIELD[stream];
      const brochures = urls.filter(isLikelyBrochure);
      const forms = urls.filter((u) => !isLikelyBrochure(u) && isLikelyForm(u));
      const others = urls.filter((u) => !isLikelyBrochure(u) && !isLikelyForm(u));

      if (!parsed[urlField]) {
        parsed[urlField] = forms[0] ?? others[0] ?? null;
      }
      if (!parsed.brochure_url && brochures.length) {
        parsed.brochure_url = brochures[0];
      }
    }

    return json(parsed, 200);
  } catch (e) {
    console.error("extract-opportunity error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
