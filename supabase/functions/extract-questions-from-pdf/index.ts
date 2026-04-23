// extract-questions-from-pdf
//
// MANUAL TEST CASES:
// 1. Valid admin + valid PDF + mode=single → 200, 1 challenge created, log outcome=success.
// 2. Valid admin + valid PDF + mode=batch + batch_size=5 → 200, 1-5 challenges, outcome=success.
// 3. Non-admin caller → 403.
// 4. source_id is a topic_prompt source → 400.
// 5. AI returns malformed JSON → outcome=parse_fail, 500 retryable.
// 6. AI returns empty/all-invalid array → outcome=validation_fail, 422.
// 7. AI rate limited → outcome=rate_limit, 429.
// 8. AI quota exhausted → outcome=quota_exceeded, 402.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-3-flash-preview";

// ----- Inlined v1 payload schemas (mirror of src/lib/bar/types.ts) -----
const McqPayloadSchema = z.object({
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2).max(6),
  correct_option_id: z.string().min(1),
}).refine((p) => p.options.some((o) => o.id === p.correct_option_id), { message: "correct_option_id mismatch" });

const IssueSpotterPayloadSchema = z.object({
  issue_options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(3).max(10),
  correct_issue_ids: z.array(z.string().min(1)).min(1),
}).refine((p) => {
  const ids = new Set(p.issue_options.map((o) => o.id));
  return p.correct_issue_ids.every((id) => ids.has(id));
}, { message: "correct_issue_ids mismatch" });

const SpeedRoundPayloadSchema = z.object({
  questions: z.array(z.object({ id: z.string().min(1), prompt: z.string().min(1), answer: z.string().min(1) })).min(5).max(15),
  time_limit_seconds: z.number().int().min(30).max(300),
});

const JurisdictionPayloadSchema = z.object({
  options: z.array(z.object({ id: z.string().min(1), jurisdiction: z.string().min(1), reasoning: z.string().min(1) })).min(2).max(5),
  correct_option_id: z.string().min(1),
}).refine((p) => p.options.some((o) => o.id === p.correct_option_id), { message: "correct_option_id mismatch" });

const V1_TYPES = ["mcq", "issue_spotter", "speed_round", "jurisdiction"] as const;
type V1Type = typeof V1_TYPES[number];

const AREAS = [
  "constitutional", "criminal", "contract", "torts", "corporate", "ip", "labour", "tax", "evidence",
  "procedure", "family", "property", "administrative", "international", "jurisprudence", "environmental", "other",
] as const;
const DIFFS = ["easy", "medium", "hard"] as const;

// ----- Inlined scoring constants -----
const BASE_POINTS_BY_TYPE: Record<V1Type, number> = {
  mcq: 5, issue_spotter: 15, jurisdiction: 10, speed_round: 3,
};
const DIFFICULTY_MULTIPLIER: Record<typeof DIFFS[number], number> = { easy: 1.0, medium: 1.5, hard: 2.0 };

function computeBasePoints(type: V1Type, diff: typeof DIFFS[number], speedRoundCount?: number): number {
  if (type === "speed_round") {
    const n = speedRoundCount ?? 5;
    return Math.max(1, Math.min(100, Math.round(BASE_POINTS_BY_TYPE.speed_round * n * DIFFICULTY_MULTIPLIER[diff])));
  }
  return Math.max(1, Math.min(100, Math.round(BASE_POINTS_BY_TYPE[type] * DIFFICULTY_MULTIPLIER[diff])));
}

// ----- Body schema -----
const BodySchema = z.object({
  source_id: z.string().uuid(),
  mode: z.enum(["single", "batch"]),
  batch_size: z.number().int().min(1).max(20).optional(),
  question_type_hint: z.enum(V1_TYPES).optional(),
  area_of_law_hint: z.enum(AREAS).optional(),
  difficulty_hint: z.enum(DIFFS).optional(),
});

function buildSystemPrompt(mode: "single" | "batch", batchSize: number, hints: { type?: string; area?: string; diff?: string }): string {
  const sizeLine = mode === "single"
    ? "Return EXACTLY 1 item in the array."
    : `Return between 1 and ${batchSize} items.`;
  const hintLines = [
    hints.type ? `Focus primarily on producing ${hints.type} questions.` : "",
    hints.area ? `Focus primarily on questions in the area of ${hints.area}.` : "",
    hints.diff ? `Target ${hints.diff} difficulty.` : "",
  ].filter(Boolean).join("\n");

  return `You are a legal question extraction engine for an Indian law student platform. You will be given a PDF (legal textbook, past exam paper, study material, or case compilation). Extract structured legal questions from it and return them as JSON.

YOU MUST RETURN ONLY A JSON ARRAY. No markdown fences, no preamble, no commentary. Start with [ and end with ].

Each item in the array is one candidate question matching this schema:

{
  "question_type": "mcq" | "issue_spotter" | "speed_round" | "jurisdiction",
  "area_of_law": "constitutional" | "criminal" | "contract" | "torts" | "corporate" | "ip" | "labour" | "tax" | "evidence" | "procedure" | "family" | "property" | "administrative" | "international" | "jurisprudence" | "environmental" | "other",
  "difficulty": "easy" | "medium" | "hard",
  "title": string (60 chars max),
  "prompt": string,
  "explanation": string | null,
  "source_page": number | null,
  "payload": { ...type-specific... }
}

Per-type payload shapes:
- mcq: { "options": [{"id":"a","text":"..."}, ...] (2-6), "correct_option_id": "a" }
- issue_spotter: { "issue_options": [{"id":"a","text":"..."}, ...] (3-10), "correct_issue_ids": ["a","c"] }
- speed_round: { "questions": [{"id":"q1","prompt":"...","answer":"..."}, ...] (5-15), "time_limit_seconds": 60 }
- jurisdiction: { "options": [{"id":"a","jurisdiction":"...","reasoning":"..."}, ...] (2-5), "correct_option_id": "a" }

RULES:
1. Extract only questions clearly supported by the PDF. Do NOT fabricate. Do NOT invent citations.
2. If the PDF already contains MCQs (CLAT/AILET-style), preserve original options and correct answers.
3. Doctrinal text → may construct questions, but only on content explicitly stated.
4. ONLY use the 4 types: mcq, issue_spotter, speed_round, jurisdiction.
5. Issue spotter: rich fact pattern, multiple identifiable issues, short option phrases.
6. Jurisdiction: only when the question is genuinely about which forum/law applies.
7. Speed round: rapid-fire definition/section/case-name recall. Short prompts/answers.
8. Difficulty: easy=foundational; medium=apply-to-facts; hard=multi-step or exceptions.
9. Area of law: pick ONE closest match. Use 'other' only if cross-cutting.
10. Option ids: short strings ("a", "b", "c", "d"; "q1", "q2" for speed round).
11. ${sizeLine} If literally nothing extractable, return exactly one MCQ with title='No extractable content', area='other', difficulty='easy', and prompt explaining why. NEVER return an empty array.
12. NEVER include a question whose answer you are not confident about.

${hintLines}

Return ONLY the JSON array. No explanation. No markdown.`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function stripFences(t: string): string {
  let s = t.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) s = fence[1].trim();
  // Find first [ and last ]
  const first = s.indexOf("[");
  const last = s.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

function validatePayload(qt: V1Type, payload: unknown): boolean {
  switch (qt) {
    case "mcq": return McqPayloadSchema.safeParse(payload).success;
    case "issue_spotter": return IssueSpotterPayloadSchema.safeParse(payload).success;
    case "speed_round": return SpeedRoundPayloadSchema.safeParse(payload).success;
    case "jurisdiction": return JurisdictionPayloadSchema.safeParse(payload).success;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const start = Date.now();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let generationId: string | null = null;
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

  const finalizeLog = async (patch: Record<string, unknown>) => {
    if (!generationId) return;
    await adminClient.from("bar_ai_generations").update({ ...patch, duration_ms: Date.now() - start }).eq("id", generationId);
  };

  try {
    if (!LOVABLE_API_KEY) return json(500, { error: "LOVABLE_API_KEY not configured", retryable: false });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized", retryable: false });

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userRes?.user?.id) return json(401, { error: "Unauthorized", retryable: false });
    const userId = userRes.user.id;

    // Admin check
    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return json(403, { error: "Forbidden — admin only", retryable: false });

    // Parse body
    const parsedBody = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) return json(400, { error: "Invalid body", details: parsedBody.error.flatten(), retryable: false });
    const { source_id, mode, question_type_hint, area_of_law_hint, difficulty_hint } = parsedBody.data;
    const batchSize = parsedBody.data.batch_size ?? 10;

    // Source check
    const { data: source, error: srcErr } = await adminClient.from("bar_sources").select("*").eq("id", source_id).maybeSingle();
    if (srcErr) return json(500, { error: srcErr.message, retryable: true });
    if (!source) return json(404, { error: "Source not found", retryable: false });
    if (source.source_type !== "pdf_extraction") return json(400, { error: "Source is not a PDF extraction source", retryable: false });
    if (!source.storage_path) return json(400, { error: "Source has no storage_path", retryable: false });

    // Insert log row
    const generationType = mode === "single" ? "pdf_extract_single" : "pdf_extract_batch";
    const { data: logRow, error: logErr } = await adminClient.from("bar_ai_generations").insert({
      source_id, generation_type: generationType, requested_by: userId,
      question_type_hint: question_type_hint ?? null,
      area_of_law_hint: area_of_law_hint ?? null,
      difficulty_hint: difficulty_hint ?? null,
      model: MODEL,
      outcome: "ai_error", // placeholder; overwritten on success/known-failure
    }).select("id").single();
    if (logErr || !logRow) return json(500, { error: "Failed to create log row", retryable: true });
    generationId = logRow.id;

    // Download PDF
    const { data: fileData, error: dlErr } = await adminClient.storage.from("bar-sources").download(source.storage_path);
    if (dlErr || !fileData) {
      await finalizeLog({ outcome: "ai_error", error_message: dlErr?.message ?? "PDF download failed" });
      return json(404, { error: "PDF not found in storage", retryable: false });
    }
    const base64 = bytesToBase64(new Uint8Array(await fileData.arrayBuffer()));

    // Build prompt
    const systemPrompt = buildSystemPrompt(mode, batchSize, {
      type: question_type_hint, area: area_of_law_hint, diff: difficulty_hint,
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "file", file: { filename: "source.pdf", file_data: `data:application/pdf;base64,${base64}` } },
              { type: "text", text: "Extract questions from this PDF as instructed. Return ONLY the JSON array." },
            ],
          },
        ],
      }),
    });

    if (aiResp.status === 429) {
      await finalizeLog({ outcome: "rate_limit", error_message: "AI gateway rate limited" });
      return json(429, { error: "Rate limited — try again shortly.", retryable: true });
    }
    if (aiResp.status === 402) {
      await finalizeLog({ outcome: "quota_exceeded", error_message: "AI credits exhausted" });
      return json(402, { error: "AI credits exhausted.", retryable: false });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      await finalizeLog({ outcome: "ai_error", error_message: `Gateway ${aiResp.status}: ${t.slice(0, 500)}` });
      return json(500, { error: "AI gateway error", retryable: true });
    }

    const aiData = await aiResp.json();
    const text: string = aiData.choices?.[0]?.message?.content ?? "";
    const promptTokens = aiData.usage?.prompt_tokens ?? null;
    const completionTokens = aiData.usage?.completion_tokens ?? null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch {
      await finalizeLog({ outcome: "parse_fail", error_message: "JSON parse failed", prompt_tokens: promptTokens, completion_tokens: completionTokens });
      return json(500, { error: "AI returned malformed JSON", retryable: true });
    }
    if (!Array.isArray(parsed)) {
      await finalizeLog({ outcome: "parse_fail", error_message: "Expected JSON array", prompt_tokens: promptTokens, completion_tokens: completionTokens });
      return json(500, { error: "AI did not return an array", retryable: true });
    }

    // Validate items
    const validItems: any[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const it: any = item;
      if (!V1_TYPES.includes(it.question_type)) continue;
      if (!AREAS.includes(it.area_of_law)) continue;
      if (!DIFFS.includes(it.difficulty)) continue;
      if (typeof it.title !== "string" || typeof it.prompt !== "string") continue;
      if (!validatePayload(it.question_type, it.payload)) {
        console.log("Validation failed for item type:", it.question_type);
        continue;
      }
      validItems.push(it);
    }

    if (validItems.length === 0) {
      await finalizeLog({ outcome: "validation_fail", error_message: "No items passed validation", prompt_tokens: promptTokens, completion_tokens: completionTokens });
      return json(422, { error: "AI output did not pass validation", retryable: true });
    }

    // Insert challenges
    const rows = validItems.map((it: any) => {
      const speedCount = it.question_type === "speed_round" ? it.payload.questions?.length : undefined;
      const points = computeBasePoints(it.question_type as V1Type, it.difficulty, speedCount);
      const page = Number.isInteger(it.source_page) ? it.source_page : null;
      const citation = page != null
        ? `Adapted from ${source.title}, page ${page}`
        : `Adapted from ${source.title}`;
      return {
        title: String(it.title).slice(0, 200),
        prompt: it.prompt,
        explanation: typeof it.explanation === "string" ? it.explanation : null,
        question_type: it.question_type,
        area_of_law: it.area_of_law,
        difficulty: it.difficulty,
        payload: it.payload,
        points_base: points,
        status: "draft" as const,
        source_id,
        source_page: page,
        source_citation: citation,
        ai_generation_id: generationId,
        created_by: userId,
      };
    });

    const { data: inserted, error: insErr } = await adminClient.from("bar_challenges").insert(rows).select("id");
    if (insErr) {
      await finalizeLog({ outcome: "ai_error", error_message: insErr.message, prompt_tokens: promptTokens, completion_tokens: completionTokens });
      return json(500, { error: "Failed to insert challenges: " + insErr.message, retryable: true });
    }

    await finalizeLog({
      outcome: "success",
      challenges_created: inserted?.length ?? 0,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
    });

    return json(200, {
      generation_id: generationId,
      challenges_created: inserted?.length ?? 0,
      challenge_ids: (inserted ?? []).map((r: any) => r.id),
    });
  } catch (e) {
    console.error("extract-questions-from-pdf error:", e);
    await finalizeLog({ outcome: "ai_error", error_message: e instanceof Error ? e.message : "Unknown" });
    return json(500, { error: e instanceof Error ? e.message : "Unknown", retryable: true });
  }
});
