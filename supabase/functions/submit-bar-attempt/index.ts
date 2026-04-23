// submit-bar-attempt
//
// MANUAL TEST CASES:
// 1. Authenticated user submits a valid MCQ answer to an approved challenge → 200 with is_correct + new_stats.
// 2. Submit an unapproved challenge id → 403.
// 3. Submit the same challenge twice → 409 (already_attempted).
// 4. Submit a malformed answer (wrong shape for type) → 400 with grading error.
// 5. Submit without Authorization header → 401.
// 6. After 20 attempts in one UTC day, 21st submit → 429 (daily_cap_exceeded).
// 7. Crossing a rank threshold returns new_stats.designation_changed=true and previous_designation set.
//
// time_taken_seconds is self-reported by the client (honor system for v1; a determined
// student could falsify it for speed_round). Not a security concern for grading correctness
// since it does not affect points awarded — purely a stat field for now.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Inlined types & schemas (mirror src/lib/bar/types.ts & scoring.ts) ----------

type V1Type = "mcq" | "issue_spotter" | "speed_round" | "jurisdiction";

const McqPayloadSchema = z.object({
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2).max(6),
  correct_option_id: z.string().min(1),
});
const McqAnswerSchema = z.object({ selected_option_id: z.string().min(1) });

const IssueSpotterPayloadSchema = z.object({
  issue_options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(3).max(10),
  correct_issue_ids: z.array(z.string().min(1)).min(1),
});
const IssueSpotterAnswerSchema = z.object({
  selected_issue_ids: z.array(z.string().min(1)),
});

const SpeedRoundPayloadSchema = z.object({
  questions: z.array(z.object({ id: z.string().min(1), prompt: z.string().min(1), answer: z.string().min(1) })).min(5).max(15),
  time_limit_seconds: z.number().int().min(30).max(300),
});
const SpeedRoundAnswerSchema = z.object({
  answers: z.array(z.object({ question_id: z.string().min(1), submitted: z.string() })),
});

const JurisdictionPayloadSchema = z.object({
  options: z.array(z.object({ id: z.string().min(1), jurisdiction: z.string().min(1), reasoning: z.string().min(1) })).min(2).max(5),
  correct_option_id: z.string().min(1),
});
const JurisdictionAnswerSchema = z.object({ selected_option_id: z.string().min(1) });

class GradingError extends Error {}

function gradeMcq(payload: z.infer<typeof McqPayloadSchema>, answer: z.infer<typeof McqAnswerSchema>, points: number) {
  const correct = answer.selected_option_id === payload.correct_option_id;
  return { is_correct: correct, points_awarded: correct ? points : 0 };
}

function gradeIssueSpotter(payload: z.infer<typeof IssueSpotterPayloadSchema>, answer: z.infer<typeof IssueSpotterAnswerSchema>, points: number) {
  const sub = new Set(answer.selected_issue_ids);
  const correct = new Set(payload.correct_issue_ids);
  const exact = sub.size === correct.size && [...sub].every((id) => correct.has(id));
  return { is_correct: exact, points_awarded: exact ? points : 0 };
}

function gradeSpeedRound(payload: z.infer<typeof SpeedRoundPayloadSchema>, answer: z.infer<typeof SpeedRoundAnswerSchema>, points: number) {
  const total = payload.questions.length;
  if (total === 0) return { is_correct: false, points_awarded: 0, per_question: [] as Array<{ id: string; prompt: string; submitted: string; correct: string; got_right: boolean }> };
  const map = new Map(answer.answers.map((a) => [a.question_id, a.submitted]));
  let count = 0;
  const per_question: Array<{ id: string; prompt: string; submitted: string; correct: string; got_right: boolean }> = [];
  for (const q of payload.questions) {
    const submittedRaw = map.get(q.id) ?? "";
    const sub = submittedRaw.trim().toLowerCase();
    const expected = q.answer.trim().toLowerCase();
    const got_right = sub.length > 0 && sub === expected;
    if (got_right) count++;
    per_question.push({ id: q.id, prompt: q.prompt, submitted: submittedRaw, correct: q.answer, got_right });
  }
  const ratio = count / total;
  return { is_correct: ratio >= 0.7, points_awarded: Math.floor(ratio * points), per_question };
}

function gradeJurisdiction(payload: z.infer<typeof JurisdictionPayloadSchema>, answer: z.infer<typeof JurisdictionAnswerSchema>, points: number) {
  const correct = answer.selected_option_id === payload.correct_option_id;
  return { is_correct: correct, points_awarded: correct ? points : 0 };
}

// ---------- Body schema ----------
const BodySchema = z.object({
  challenge_id: z.string().uuid(),
  submitted_answer: z.unknown(),
  time_taken_seconds: z.number().int().min(0).max(86400).optional(),
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Parse body
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return jsonResponse(400, { error: "invalid_body", details: parsed.error.flatten() });
    const { challenge_id, submitted_answer, time_taken_seconds } = parsed.data;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(401, { error: "unauthenticated" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Caller identity client (uses caller JWT)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse(401, { error: "unauthenticated" });
    const userId = userData.user.id;

    // Service-role client for trusted reads/writes
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch challenge with full payload
    const { data: challenge, error: chErr } = await admin
      .from("bar_challenges")
      .select("id, status, question_type, payload, points_base, explanation")
      .eq("id", challenge_id)
      .maybeSingle();
    if (chErr) return jsonResponse(500, { error: "db_error", retryable: true });
    if (!challenge) return jsonResponse(404, { error: "challenge_not_found" });
    if (challenge.status !== "approved") return jsonResponse(403, { error: "challenge_not_approved" });

    // Pre-check: already attempted?
    const { data: prior } = await admin
      .from("bar_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("challenge_id", challenge_id)
      .maybeSingle();
    if (prior) return jsonResponse(409, { error: "already_attempted" });

    // Grade
    const type = challenge.question_type as V1Type;
    let is_correct = false;
    let points_awarded = 0;
    let per_question: Array<{ id: string; prompt: string; submitted: string; correct: string; got_right: boolean }> | undefined;
    let correct_answer_summary = "";

    try {
      switch (type) {
        case "mcq": {
          const p = McqPayloadSchema.safeParse(challenge.payload);
          const a = McqAnswerSchema.safeParse(submitted_answer);
          if (!p.success) throw new GradingError("invalid mcq payload");
          if (!a.success) throw new GradingError("invalid mcq answer");
          const r = gradeMcq(p.data, a.data, challenge.points_base);
          is_correct = r.is_correct; points_awarded = r.points_awarded;
          const correctOpt = p.data.options.find((o) => o.id === p.data.correct_option_id);
          correct_answer_summary = `The correct answer was: ${correctOpt?.text ?? p.data.correct_option_id}`;
          break;
        }
        case "issue_spotter": {
          const p = IssueSpotterPayloadSchema.safeParse(challenge.payload);
          const a = IssueSpotterAnswerSchema.safeParse(submitted_answer);
          if (!p.success) throw new GradingError("invalid issue_spotter payload");
          if (!a.success) throw new GradingError("invalid issue_spotter answer");
          const r = gradeIssueSpotter(p.data, a.data, challenge.points_base);
          is_correct = r.is_correct; points_awarded = r.points_awarded;
          const correctTexts = p.data.issue_options
            .filter((o) => p.data.correct_issue_ids.includes(o.id))
            .map((o) => o.text);
          correct_answer_summary = `Correct issues: ${correctTexts.join(", ")}`;
          break;
        }
        case "speed_round": {
          const p = SpeedRoundPayloadSchema.safeParse(challenge.payload);
          const a = SpeedRoundAnswerSchema.safeParse(submitted_answer);
          if (!p.success) throw new GradingError("invalid speed_round payload");
          if (!a.success) throw new GradingError("invalid speed_round answer");
          const r = gradeSpeedRound(p.data, a.data, challenge.points_base);
          is_correct = r.is_correct; points_awarded = r.points_awarded; per_question = r.per_question;
          const correctCount = per_question!.filter((q) => q.got_right).length;
          correct_answer_summary = `You got ${correctCount} of ${p.data.questions.length} correct.`;
          break;
        }
        case "jurisdiction": {
          const p = JurisdictionPayloadSchema.safeParse(challenge.payload);
          const a = JurisdictionAnswerSchema.safeParse(submitted_answer);
          if (!p.success) throw new GradingError("invalid jurisdiction payload");
          if (!a.success) throw new GradingError("invalid jurisdiction answer");
          const r = gradeJurisdiction(p.data, a.data, challenge.points_base);
          is_correct = r.is_correct; points_awarded = r.points_awarded;
          const correctOpt = p.data.options.find((o) => o.id === p.data.correct_option_id);
          correct_answer_summary = correctOpt
            ? `The correct jurisdiction was: ${correctOpt.jurisdiction} — ${correctOpt.reasoning}`
            : "Correct option could not be resolved.";
          break;
        }
        default:
          return jsonResponse(400, { error: "unsupported_question_type" });
      }
    } catch (e) {
      if (e instanceof GradingError) return jsonResponse(400, { error: "grading_error", message: e.message });
      throw e;
    }

    // Capture previous designation BEFORE insert
    const { data: priorStats } = await admin
      .from("bar_user_stats")
      .select("designation")
      .eq("user_id", userId)
      .maybeSingle();
    const previous_designation = (priorStats?.designation ?? "trainee") as string;

    // Insert attempt — triggers handle stats/streak/designation/daily cap
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      challenge_id,
      submitted_answer: submitted_answer as unknown,
      is_correct,
      points_awarded,
    };
    if (typeof time_taken_seconds === "number") insertPayload.time_taken_seconds = time_taken_seconds;

    const { error: insertErr } = await admin.from("bar_attempts").insert(insertPayload);
    if (insertErr) {
      const msg = insertErr.message ?? "";
      if (msg.includes("daily_cap_exceeded")) return jsonResponse(429, { error: "daily_cap_exceeded" });
      if (msg.includes("challenge_not_approved")) return jsonResponse(403, { error: "challenge_not_approved" });
      if (msg.includes("duplicate") || (insertErr as { code?: string }).code === "23505") {
        return jsonResponse(409, { error: "already_attempted" });
      }
      console.error("insert error", insertErr);
      return jsonResponse(500, { error: "db_error", retryable: true });
    }

    // Re-fetch updated stats
    const { data: newStats } = await admin
      .from("bar_user_stats")
      .select("total_points, accuracy_pct, current_streak, longest_streak, designation")
      .eq("user_id", userId)
      .maybeSingle();

    const designation = (newStats?.designation ?? previous_designation) as string;

    return jsonResponse(200, {
      is_correct,
      points_awarded,
      explanation: challenge.explanation ?? null,
      correct_answer_summary,
      per_question,
      new_stats: {
        total_points: newStats?.total_points ?? 0,
        accuracy_pct: Number(newStats?.accuracy_pct ?? 0),
        current_streak: newStats?.current_streak ?? 0,
        longest_streak: newStats?.longest_streak ?? 0,
        designation,
        designation_changed: designation !== previous_designation,
        previous_designation,
      },
    });
  } catch (e) {
    console.error("submit-bar-attempt fatal", e);
    return jsonResponse(500, { error: "internal_error", retryable: true });
  }
});
