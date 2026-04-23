import {
  GradingError,
  IssueSpotterAnswerSchema,
  IssueSpotterPayloadSchema,
  JurisdictionAnswerSchema,
  JurisdictionPayloadSchema,
  McqAnswerSchema,
  McqPayloadSchema,
  SpeedRoundAnswerSchema,
  SpeedRoundPayloadSchema,
  type BarDesignation,
  type Difficulty,
  type IssueSpotterAnswer,
  type IssueSpotterPayload,
  type JurisdictionAnswer,
  type JurisdictionPayload,
  type McqAnswer,
  type McqPayload,
  type QuestionType,
  type SpeedRoundAnswer,
  type SpeedRoundPayload,
} from "./types";
import {
  BASE_POINTS_BY_TYPE,
  DIFFICULTY_MULTIPLIER,
  RANK_THRESHOLDS,
} from "./constants";

export interface GradeResult {
  is_correct: boolean;
  points_awarded: number;
}

export function computeBasePoints(
  type: QuestionType,
  difficulty: Difficulty,
  questionCount?: number,
): number {
  const base = BASE_POINTS_BY_TYPE[type];
  const mult = DIFFICULTY_MULTIPLIER[difficulty];
  const raw =
    type === "speed_round"
      ? base * (questionCount ?? 0) * mult
      : base * mult;
  const result = Math.floor(raw);
  // Clamp to schema CHECK constraint (1-100). Caller is responsible for sane inputs.
  return Math.max(1, Math.min(100, result));
}

export function computeDesignation(
  totalPoints: number,
  accuracyPct: number,
): BarDesignation {
  // Walk thresholds high → low; first one whose BOTH gates pass wins.
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = RANK_THRESHOLDS[i];
    if (totalPoints >= t.minPoints && accuracyPct >= t.minAccuracy) {
      return t.designation;
    }
  }
  return "trainee";
}

export function computeNewStreak(
  currentStreak: number,
  longestStreak: number,
  wasCorrect: boolean,
): { current: number; longest: number } {
  if (!wasCorrect) return { current: 0, longest: longestStreak };
  const next = currentStreak + 1;
  return { current: next, longest: Math.max(longestStreak, next) };
}

export function gradeMcq(
  payload: McqPayload,
  answer: McqAnswer,
  pointsBase: number,
): GradeResult {
  const correct = answer.selected_option_id === payload.correct_option_id;
  return { is_correct: correct, points_awarded: correct ? pointsBase : 0 };
}

export function gradeIssueSpotter(
  payload: IssueSpotterPayload,
  answer: IssueSpotterAnswer,
  pointsBase: number,
): GradeResult {
  const submitted = new Set(answer.selected_issue_ids);
  const correct = new Set(payload.correct_issue_ids);
  const exact =
    submitted.size === correct.size &&
    [...submitted].every((id) => correct.has(id));
  return { is_correct: exact, points_awarded: exact ? pointsBase : 0 };
}

export function gradeSpeedRound(
  payload: SpeedRoundPayload,
  answer: SpeedRoundAnswer,
  pointsBase: number,
): GradeResult {
  const total = payload.questions.length;
  if (total === 0) return { is_correct: false, points_awarded: 0 };
  const answerMap = new Map(
    answer.answers.map((a) => [a.question_id, a.submitted]),
  );
  let correctCount = 0;
  for (const q of payload.questions) {
    const sub = (answerMap.get(q.id) ?? "").trim().toLowerCase();
    const expected = q.answer.trim().toLowerCase();
    if (sub.length > 0 && sub === expected) correctCount++;
  }
  const ratio = correctCount / total;
  const points = Math.floor(ratio * pointsBase);
  return { is_correct: ratio >= 0.7, points_awarded: points };
}

export function gradeJurisdiction(
  payload: JurisdictionPayload,
  answer: JurisdictionAnswer,
  pointsBase: number,
): GradeResult {
  const correct = answer.selected_option_id === payload.correct_option_id;
  return { is_correct: correct, points_awarded: correct ? pointsBase : 0 };
}

export function gradeAttempt(
  type: QuestionType,
  payload: unknown,
  answer: unknown,
  pointsBase: number,
): GradeResult {
  switch (type) {
    case "mcq": {
      const p = McqPayloadSchema.safeParse(payload);
      const a = McqAnswerSchema.safeParse(answer);
      if (!p.success) throw new GradingError("invalid mcq payload");
      if (!a.success) throw new GradingError("invalid mcq answer");
      return gradeMcq(p.data, a.data, pointsBase);
    }
    case "issue_spotter": {
      const p = IssueSpotterPayloadSchema.safeParse(payload);
      const a = IssueSpotterAnswerSchema.safeParse(answer);
      if (!p.success) throw new GradingError("invalid issue_spotter payload");
      if (!a.success) throw new GradingError("invalid issue_spotter answer");
      return gradeIssueSpotter(p.data, a.data, pointsBase);
    }
    case "speed_round": {
      const p = SpeedRoundPayloadSchema.safeParse(payload);
      const a = SpeedRoundAnswerSchema.safeParse(answer);
      if (!p.success) throw new GradingError("invalid speed_round payload");
      if (!a.success) throw new GradingError("invalid speed_round answer");
      return gradeSpeedRound(p.data, a.data, pointsBase);
    }
    case "jurisdiction": {
      const p = JurisdictionPayloadSchema.safeParse(payload);
      const a = JurisdictionAnswerSchema.safeParse(answer);
      if (!p.success) throw new GradingError("invalid jurisdiction payload");
      if (!a.success) throw new GradingError("invalid jurisdiction answer");
      return gradeJurisdiction(p.data, a.data, pointsBase);
    }
    default:
      throw new GradingError(`question type ${type} not implemented in v1`);
  }
}
