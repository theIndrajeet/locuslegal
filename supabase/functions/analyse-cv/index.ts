import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a CV reviewer trio for the INDIAN LEGAL MARKET. You speak with the consensus of three veterans:

1. TIER-1 RECRUITER — 12 years hiring at Cyril Amarchand Mangaldas, Shardul Amarchand, AZB, Khaitan, Trilegal, JSA, S&R. You triage 400 CVs/week. You spot fluff in seconds.
2. LITIGATION SENIOR — Senior counsel running a Supreme Court / Delhi High Court chamber. You hire on raw drafting ability, research depth, and willingness to grind.
3. PLACEMENT COMMITTEE FACULTY — NLU placement chair. You see what differentiates the top 10% from the rest at NLSIU, NALSAR, NUJS, NLU-D.

Your tone is BRUTALLY HONEST — partner-level candour. No sugar-coating. No participation trophies. If something is generic, weak, fabricated-looking, or below tier-1 bar, you say so plainly. But you are FAIR — you reward genuine signals (real moot wins, substantive internships at known firms/chambers, peer-reviewed publications, demonstrated drafting).

You are calibrated to the INDIAN LEGAL MARKET specifically:
- Real signals: NLU pedigree (NLSIU/NALSAR/NUJS/NLU-D > other NLUs > top private > rest), CGPA above 7.5 from NLU or 8.5 from non-NLU, top-tier moots (Jessup, Vis, Manfred Lachs, Stetson, Henry Dunant, FDI Moot, NLS Trilegal — wins/finals/QF count), substantive internships at the firms above OR known senior counsel chambers (Sr. Adv. names), publications in NUJS Law Review / NLSIR / SCC Online Blog / Indian Law Review / Cambridge Law Review / Manupatra Articles, ADR/arbitration certifications (CIArb), language work (German/French/Mandarin for arbitration), tech-law signals (data protection, IP).
- Weak signals you punish: "Legal Aid Cell volunteer" listed as work experience, generic MUN, vague "research projects", certificate-mill courses (random Coursera 4-hour completions), inflated titles ("Founder & CEO" of a college club), buzzword soup ("dynamic, hardworking, team player"), missing dates, no quantified outputs ("drafted 12 plaints" beats "assisted with drafting").
- Drafting & writing: examine specificity, verbs, quantification, citation hygiene.

You output STRUCTURED JSON via the provided tool — never freeform text.

Scoring rubric (0–100 overall, weighted):
- Pedigree & Academics (20): institution tier, CGPA, rank if shown, scholarships, exchange.
- Experience Substance (30): which firms/chambers, role specificity, duration, quantified output, repeat-callbacks/PPOs.
- Moots & Advocacy (15): tier of moot, result, role.
- Publications & Research (15): venue, peer review, sole vs co-authored, citation count if known.
- Skills & Differentiators (10): languages, ADR creds, tech-law, data, drafting samples.
- Presentation & Hygiene (10): structure, dates, typos, length (1-2 pages), font discipline, no photos, no DOB.

Tier-fit percentages must be HONEST and add insight (not all 70%). A weak CV should get 12% tier-1, 25% boutique, 45% in-house, 60% PSU. A strong NLSIU CV with Jessup finals + AZB summer might get 75% tier-1, 80% boutique, 65% in-house, 50% PSU.

Verdict is ONE sentence. Sharp. No hedging. Examples:
- "Solid NLU profile undermined by generic phrasing — fixable in a weekend."
- "Reads like a participation-trophy CV; nothing here makes a tier-1 partner pause."
- "Genuinely strong — top-quartile for CAM/AZB summer pool."
- "Promising junior with real chamber exposure but academics will gate you out of magic-circle equivalents."

Prioritized fixes: rank by IMPACT × EFFORT. Top 5 only. Each fix shows the EXACT current text from the CV (or "MISSING") and a concrete REWRITE the candidate can copy.

Red flags: list only genuine concerns (gaps, inflated titles, plagiarism risk, formatting disasters). Empty array if none.

Strengths: list only genuine differentiators (not "good communication"). Empty array if the CV is mediocre — do not invent strengths.

Section scores: rate each major CV section 0-10 with one-line critique.`;

const TOOL = {
  type: "function",
  function: {
    name: "submit_cv_analysis",
    description: "Return the structured CV analysis.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "integer", minimum: 0, maximum: 100 },
        verdict: { type: "string", description: "One sharp sentence. No hedging." },
        candidate_snapshot: {
          type: "object",
          properties: {
            name_present: { type: "boolean" },
            college_detected: { type: "string" },
            year_or_graduation: { type: "string" },
            cgpa_or_rank: { type: "string", description: "As shown on CV; empty string if not shown." },
          },
          required: ["name_present", "college_detected", "year_or_graduation", "cgpa_or_rank"],
          additionalProperties: false,
        },
        tier_fit: {
          type: "object",
          description: "Honest 0-100 fit percentages. Must vary based on CV strength.",
          properties: {
            tier1_firms: { type: "integer", minimum: 0, maximum: 100, description: "CAM, SAM, AZB, Khaitan, Trilegal, JSA, S&R" },
            boutique_litigation: { type: "integer", minimum: 0, maximum: 100, description: "Sr. counsel chambers, dispute boutiques" },
            inhouse_corporate: { type: "integer", minimum: 0, maximum: 100, description: "GE, Microsoft, Reliance, Tata legal" },
            psu_government: { type: "integer", minimum: 0, maximum: 100, description: "PSU, government legal advisor, judiciary" },
            policy_thinktank: { type: "integer", minimum: 0, maximum: 100, description: "Vidhi, CCS, NIPFP, IDFC Institute" },
          },
          required: ["tier1_firms", "boutique_litigation", "inhouse_corporate", "psu_government", "policy_thinktank"],
          additionalProperties: false,
        },
        section_scores: {
          type: "array",
          description: "One entry per major section detected.",
          items: {
            type: "object",
            properties: {
              section: { type: "string", description: "e.g. Education, Internships, Moots, Publications, Skills, Presentation" },
              score: { type: "integer", minimum: 0, maximum: 10 },
              critique: { type: "string", description: "One sharp line." },
            },
            required: ["section", "score", "critique"],
            additionalProperties: false,
          },
        },
        strengths: {
          type: "array",
          description: "Genuine differentiators only. Empty array if none.",
          items: { type: "string" },
        },
        red_flags: {
          type: "array",
          description: "Genuine concerns only.",
          items: { type: "string" },
        },
        prioritized_fixes: {
          type: "array",
          description: "Top 5, ranked by impact x effort.",
          items: {
            type: "object",
            properties: {
              priority: { type: "integer", minimum: 1, maximum: 5 },
              area: { type: "string", description: "e.g. Internships, Moots, Summary, Formatting" },
              issue: { type: "string", description: "What's wrong, partner-voice." },
              current_text: { type: "string", description: "Exact text from CV, or 'MISSING'." },
              rewrite: { type: "string", description: "Concrete copy-pasteable replacement." },
              impact: { type: "string", enum: ["high", "medium", "low"] },
              effort: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["priority", "area", "issue", "current_text", "rewrite", "impact", "effort"],
            additionalProperties: false,
          },
        },
        market_signals: {
          type: "object",
          description: "Specific Indian-legal-market signals detected.",
          properties: {
            nlu_pedigree: { type: "string", description: "tier-1-nlu | other-nlu | top-private | other | unknown" },
            top_tier_moot: { type: "boolean" },
            tier1_firm_internship: { type: "boolean" },
            chamber_internship: { type: "boolean" },
            peer_reviewed_publication: { type: "boolean" },
            quantified_outputs: { type: "boolean", description: "Does the CV use numbers (drafted X plaints, researched Y matters)?" },
          },
          required: ["nlu_pedigree", "top_tier_moot", "tier1_firm_internship", "chamber_internship", "peer_reviewed_publication", "quantified_outputs"],
          additionalProperties: false,
        },
      },
      required: ["overall_score", "verdict", "candidate_snapshot", "tier_fit", "section_scores", "strengths", "red_flags", "prioritized_fixes", "market_signals"],
      additionalProperties: false,
    },
  },
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callGemini(base64Pdf: string): Promise<{ analysis: any; usage: any }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const userContent: any[] = [
    {
      type: "file",
      file: {
        filename: "cv.pdf",
        file_data: `data:application/pdf;base64,${base64Pdf}`,
      },
    },
    {
      type: "text",
      text: "Analyse this CV against the Indian legal market. Return your verdict via the submit_cv_analysis tool. Be brutally honest — partner voice. No participation trophies.",
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "submit_cv_analysis" } },
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    const err: any = new Error(`AI gateway error ${response.status}: ${t}`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI did not return a tool call");
  }
  let parsed: any;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error("AI tool arguments were not valid JSON");
  }
  return { analysis: parsed, usage: data.usage || {} };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  let userId = "unknown";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", retryable: false }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userRes?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized", retryable: false }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const cvStoragePath = body?.cv_storage_path;
    if (typeof cvStoragePath !== "string" || !cvStoragePath.trim()) {
      return new Response(JSON.stringify({ error: "cv_storage_path required", retryable: false }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!cvStoragePath.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden", retryable: false }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: fileData, error: dlErr } = await adminClient.storage.from("cvs").download(cvStoragePath);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: "CV not found in storage", retryable: false }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arr = new Uint8Array(await fileData.arrayBuffer());
    if (arr.length > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "CV must be 5 MB or smaller", retryable: false }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const base64 = bytesToBase64(arr);

    let result;
    try {
      result = await callGemini(base64);
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", retryable: true }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (e?.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace > Usage.", retryable: false }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const { analysis, usage } = result;
    const duration_ms = Date.now() - start;

    // Persist
    const { data: inserted, error: insErr } = await adminClient
      .from("cv_analyses")
      .insert({
        user_id: userId,
        cv_storage_path: cvStoragePath,
        overall_score: analysis.overall_score,
        verdict: analysis.verdict,
        analysis,
        model: "google/gemini-2.5-pro",
        prompt_tokens: usage?.prompt_tokens ?? null,
        completion_tokens: usage?.completion_tokens ?? null,
        duration_ms,
      })
      .select("id, created_at")
      .single();

    if (insErr) {
      console.error("cv_analyses insert error:", insErr);
    }

    return new Response(JSON.stringify({
      id: inserted?.id ?? null,
      created_at: inserted?.created_at ?? new Date().toISOString(),
      analysis,
      duration_ms,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyse-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", retryable: true }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
