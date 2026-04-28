import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You draft professional cold internship/application emails for Indian law students reaching out to law firms, chambers, advocates, or in-house legal teams at companies.

You will receive structured JSON describing the TARGET (firm/company), the SENDER (the student), and an optional BRIEF (sender's answers to a guided questionnaire). Your job is to write a single email — a SUBJECT line and a BODY — that is concrete, specific, and ready to send with only a CV attached.

HARD RULES:
- Output only via the provided tool. Never include placeholders like [Your Name], [Firm Name], [Date], [Insert X]. If a field is missing, omit that sentence entirely.
- Body length: 110–180 words. Concise, no filler.
- No emojis. No exclamation marks. No "I hope this email finds you well."
- Do NOT invent credentials, marks, ranks, awards, or experience the sender did not provide.
- Sign off with the sender's display name on its own line. If display_name is missing, end with "Best regards," and nothing else.
- Mention that the CV is attached in the closing paragraph.
- If the target is a law firm/chamber/advocate: pitch a legal internship.
- If the target is a startup/SME (in-house): pitch a legal internship with their in-house team, referencing their sector or known legal needs as the reason for interest.
- One concrete reason for interest in THIS target (use sector / practice areas / city). One short line connecting the sender's most relevant experience or interest to that.
- Subject line: 6–10 words, no clickbait. Format like: "Application for Legal Internship — <Sender Name>" or "Legal Internship Enquiry — <Sender Name>, <College short>".

USING THE BRIEF (when present, treat as the sender's own priorities):
- brief.fit_reason: lead the opening hook with this reason — make it concrete, don't quote the label verbatim.
- brief.availability + brief.duration: weave naturally into the closing paragraph (e.g. "I am available for a [duration] internship during [availability]").
- brief.work_mode: only mention if "remote" or "hybrid"; otherwise omit (in-office is assumed).
- brief.signature_line: this is the ONE thing the sender wants remembered. Place it as the strongest sentence in the middle paragraph. Paraphrase, do NOT quote verbatim.
- brief.highlights: weave the picked items into the middle paragraph as natural prose — NOT a bulleted list. Lead with the highlight whose detail most overlaps with the target's practice/sector. Merge similar highlights into one sentence.
- If brief is empty/missing, fall back to standard generation using SENDER fields only.

TONE OPTIONS:
- formal (default): traditional, third-person professional. Address as "Dear Hiring Team," or "Dear Sir/Madam,".
- warm: still professional, slightly more personable, can open with "Dear <Target Short Name> Team,".
- concise: shorter (110–130 words), bullet-tight, prioritises clarity over warmth.

Always output via the draft_email tool.`;

const FOLLOWUP_SYSTEM_PROMPT = `You draft a SHORT, polite follow-up email from an Indian law student who already sent an application to a law firm / chamber / company a few days ago and has not heard back.

You will receive: TARGET (firm), SENDER (student), and ORIGINAL (when they wrote and the role they applied for).

HARD RULES:
- Output only via the draft_email tool. Never use placeholders like [Your Name], [Firm Name], [Date].
- Body length: 60–90 words. THREE short sentences plus salutation and sign-off. No more.
- No emojis. No exclamation marks. No "I hope this email finds you well." No "Just following up". No "Per my last email".
- Sentence 1: gently reference that the sender wrote on <original.applied_on> regarding the <original.role> position.
- Sentence 2: briefly reiterate genuine interest in the target (one specific reason — sector/practice/city).
- Sentence 3: offer to share additional materials (writing samples, transcripts) and thank them for their time.
- Salutation: "Dear <Target Short Name> Team," or "Dear Hiring Team,".
- Sign off with the sender's display name on its own line. If missing, end with "Best regards,".
- Subject line: 5–8 words, format like: "Following up — Legal Internship Application" or "Following up on my application — <Sender Name>".
- Do NOT re-pitch the entire CV. Do NOT repeat the original email. Do NOT mention attaching the CV again.
- Tone: courteous, low-pressure, brief.

Always output via the draft_email tool.`;

interface Internship {
  firm_name: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface BriefHighlight {
  kind: string;
  label: string;
  detail?: string | null;
}

interface Brief {
  fit_reason?: string | null;
  availability?: string | null;
  duration?: string | null;
  signature_line?: string | null;
  work_mode?: string | null;
  highlights?: BriefHighlight[];
}

interface Body {
  target: {
    name: string;
    kind: "firm" | "startup";
    type?: string | null;
    city?: string | null;
    sector?: string | null;
    practice_areas?: string | null;
    legal_needs?: string | null;
  };
  role: string;
  tone: "formal" | "warm" | "concise";
  extra_note?: string | null;
  brief?: Brief | null;
  mode?: "initial" | "followup";
  original?: { applied_on: string; role: string } | null;
  user: {
    display_name: string | null;
    college: string | null;
    degree: string | null;
    graduation_year: number | null;
    bio: string | null;
    subjects_of_interest: string[];
    internships: Internship[];
    has_cv: boolean;
  };
}

const ALLOWED_HIGHLIGHT_KINDS = new Set([
  "internship",
  "subject",
  "education",
  "moot",
  "publication",
  "cgpa",
  "bio",
]);

function sanitizeBrief(b: any): Brief | null {
  if (!b || typeof b !== "object") return null;
  const out: Brief = {};
  if (typeof b.fit_reason === "string" && b.fit_reason.trim()) out.fit_reason = b.fit_reason.trim().slice(0, 120);
  if (typeof b.availability === "string" && b.availability.trim()) out.availability = b.availability.trim().slice(0, 120);
  if (typeof b.duration === "string" && b.duration.trim()) out.duration = b.duration.trim().slice(0, 60);
  if (typeof b.signature_line === "string" && b.signature_line.trim()) out.signature_line = b.signature_line.trim().slice(0, 200);
  if (typeof b.work_mode === "string" && b.work_mode.trim()) out.work_mode = b.work_mode.trim().slice(0, 30);
  if (Array.isArray(b.highlights)) {
    out.highlights = b.highlights
      .filter((h: any) => h && typeof h === "object" && ALLOWED_HIGHLIGHT_KINDS.has(h.kind) && typeof h.label === "string")
      .slice(0, 4)
      .map((h: any) => ({
        kind: String(h.kind),
        label: String(h.label).slice(0, 120),
        detail: h.detail ? String(h.detail).slice(0, 200) : null,
      }));
  }
  // Empty brief => null
  if (!out.fit_reason && !out.availability && !out.duration && !out.signature_line && !out.work_mode && !(out.highlights && out.highlights.length)) {
    return null;
  }
  return out;
}

function validateBody(b: any): { ok: true; data: Body } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "invalid body" };
  if (!b.target || typeof b.target.name !== "string" || !b.target.name.trim())
    return { ok: false, error: "target.name required" };
  if (b.target.kind !== "firm" && b.target.kind !== "startup")
    return { ok: false, error: "target.kind must be firm|startup" };
  if (typeof b.role !== "string" || !b.role.trim()) return { ok: false, error: "role required" };
  const tone = b.tone === "warm" || b.tone === "concise" ? b.tone : "formal";
  if (!b.user || typeof b.user !== "object") return { ok: false, error: "user required" };
  return {
    ok: true,
    data: {
      target: {
        name: String(b.target.name).trim().slice(0, 200),
        kind: b.target.kind,
        type: b.target.type ? String(b.target.type).slice(0, 100) : null,
        city: b.target.city ? String(b.target.city).slice(0, 100) : null,
        sector: b.target.sector ? String(b.target.sector).slice(0, 200) : null,
        practice_areas: b.target.practice_areas ? String(b.target.practice_areas).slice(0, 300) : null,
        legal_needs: b.target.legal_needs ? String(b.target.legal_needs).slice(0, 300) : null,
      },
      role: String(b.role).trim().slice(0, 100),
      tone,
      extra_note: b.extra_note ? String(b.extra_note).slice(0, 300) : null,
      brief: sanitizeBrief(b.brief),
      mode: b.mode === "followup" ? "followup" : "initial",
      original:
        b.original && typeof b.original === "object" && b.original.applied_on
          ? {
              applied_on: String(b.original.applied_on).slice(0, 30),
              role: String(b.original.role ?? "Legal Internship").slice(0, 100),
            }
          : null,
      user: {
        display_name: b.user.display_name ? String(b.user.display_name).slice(0, 100) : null,
        college: b.user.college ? String(b.user.college).slice(0, 200) : null,
        degree: b.user.degree ? String(b.user.degree).slice(0, 50) : null,
        graduation_year: Number.isInteger(b.user.graduation_year) ? b.user.graduation_year : null,
        bio: b.user.bio ? String(b.user.bio).slice(0, 400) : null,
        subjects_of_interest: Array.isArray(b.user.subjects_of_interest)
          ? b.user.subjects_of_interest.filter((s: any) => typeof s === "string").slice(0, 10)
          : [],
        internships: Array.isArray(b.user.internships)
          ? b.user.internships.slice(0, 3).map((i: any) => ({
              firm_name: String(i.firm_name ?? "").slice(0, 200),
              role: String(i.role ?? "").slice(0, 100),
              start_date: i.start_date ?? null,
              end_date: i.end_date ?? null,
              description: i.description ? String(i.description).slice(0, 300) : null,
            }))
          : [],
        has_cv: Boolean(b.user.has_cv),
      },
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json().catch(() => null);
    const v = validateBody(raw);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isFollowup = v.data.mode === "followup";

    const briefBlock = v.data.brief && !isFollowup
      ? `\n\nBRIEF (sender's guided answers — prioritise these):\n${JSON.stringify(v.data.brief, null, 2)}`
      : "";

    const originalBlock = isFollowup && v.data.original
      ? `\n\nORIGINAL APPLICATION:\n${JSON.stringify(v.data.original, null, 2)}`
      : "";

    const userPrompt = isFollowup
      ? `TARGET:\n${JSON.stringify(v.data.target, null, 2)}\n\nSENDER:\n${JSON.stringify(
          { display_name: v.data.user.display_name, college: v.data.user.college, degree: v.data.user.degree },
          null,
          2,
        )}${originalBlock}\n\nDraft the SHORT follow-up email now via the draft_email tool.`
      : `TARGET:\n${JSON.stringify(v.data.target, null, 2)}\n\nSENDER:\n${JSON.stringify(
          v.data.user,
          null,
          2,
        )}\n\nROLE: ${v.data.role}\nTONE: ${v.data.tone}${briefBlock}\n${
          v.data.extra_note ? `\nEXTRA NOTE FROM SENDER (try to weave naturally): ${v.data.extra_note}` : ""
        }\n\nDraft the email now via the draft_email tool.`;

    const activeSystemPrompt = isFollowup ? FOLLOWUP_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "draft_email",
              description: "Return the drafted application email.",
              parameters: {
                type: "object",
                properties: {
                  subject: {
                    type: "string",
                    description: "Subject line, 6-10 words, no placeholders.",
                  },
                  body: {
                    type: "string",
                    description:
                      "Full email body, 110-180 words, salutation through signature, no placeholders.",
                  },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "draft_email" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no draft. Please retry." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: { subject?: string; body?: string };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned malformed draft. Please retry." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!parsed.subject?.trim() || !parsed.body?.trim()) {
      return new Response(JSON.stringify({ error: "AI returned empty draft. Please retry." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        subject: parsed.subject.trim().slice(0, 200),
        body: parsed.body.trim().slice(0, 4000),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("draft-application-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
