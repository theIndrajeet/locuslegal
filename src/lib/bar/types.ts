import { z } from "zod";

export type QuestionType =
  | "mcq"
  | "issue_spotter"
  | "speed_round"
  | "jurisdiction"
  | "document_review"
  | "brief_builder"
  | "ethics"
  | "client_counseling";

export type Difficulty = "easy" | "medium" | "hard";

export type AreaOfLaw =
  | "constitutional"
  | "criminal"
  | "contract"
  | "torts"
  | "corporate"
  | "ip"
  | "labour"
  | "tax"
  | "evidence"
  | "procedure"
  | "family"
  | "property"
  | "administrative"
  | "international"
  | "jurisprudence"
  | "environmental"
  | "other";

export type ChallengeStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export type BarDesignation =
  | "trainee"
  | "junior_associate"
  | "associate"
  | "senior_associate"
  | "partner"
  | "senior_partner"
  | "silk";

// ============= MCQ =============
export const McqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export const McqPayloadSchema = z
  .object({
    options: z.array(McqOptionSchema).min(2).max(6),
    correct_option_id: z.string().min(1),
  })
  .refine(
    (p) => p.options.some((o) => o.id === p.correct_option_id),
    { message: "correct_option_id must match an option id" },
  );
export const McqAnswerSchema = z.object({
  selected_option_id: z.string().min(1),
});
export type McqPayload = z.infer<typeof McqPayloadSchema>;
export type McqAnswer = z.infer<typeof McqAnswerSchema>;

// ============= Issue Spotter =============
export const IssueOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export const IssueSpotterPayloadSchema = z
  .object({
    issue_options: z.array(IssueOptionSchema).min(3).max(10),
    correct_issue_ids: z.array(z.string().min(1)).min(1),
  })
  .refine(
    (p) => {
      const ids = new Set(p.issue_options.map((o) => o.id));
      return p.correct_issue_ids.every((id) => ids.has(id));
    },
    { message: "correct_issue_ids must all reference issue_options" },
  );
export const IssueSpotterAnswerSchema = z.object({
  selected_issue_ids: z.array(z.string().min(1)),
});
export type IssueSpotterPayload = z.infer<typeof IssueSpotterPayloadSchema>;
export type IssueSpotterAnswer = z.infer<typeof IssueSpotterAnswerSchema>;

// ============= Speed Round =============
export const SpeedRoundQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  answer: z.string().min(1),
});
export const SpeedRoundPayloadSchema = z.object({
  questions: z.array(SpeedRoundQuestionSchema).min(5).max(15),
  time_limit_seconds: z.number().int().min(30).max(300),
});
export const SpeedRoundAnswerSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string().min(1),
      submitted: z.string(),
    }),
  ),
});
export type SpeedRoundPayload = z.infer<typeof SpeedRoundPayloadSchema>;
export type SpeedRoundAnswer = z.infer<typeof SpeedRoundAnswerSchema>;

// ============= Jurisdiction =============
export const JurisdictionOptionSchema = z.object({
  id: z.string().min(1),
  jurisdiction: z.string().min(1),
  reasoning: z.string().min(1),
});
export const JurisdictionPayloadSchema = z
  .object({
    options: z.array(JurisdictionOptionSchema).min(2).max(5),
    correct_option_id: z.string().min(1),
  })
  .refine(
    (p) => p.options.some((o) => o.id === p.correct_option_id),
    { message: "correct_option_id must match an option id" },
  );
export const JurisdictionAnswerSchema = z.object({
  selected_option_id: z.string().min(1),
});
export type JurisdictionPayload = z.infer<typeof JurisdictionPayloadSchema>;
export type JurisdictionAnswer = z.infer<typeof JurisdictionAnswerSchema>;

// ============= Reserved (post-v1) — schemas reject ALL submissions =============
const RejectAlways = z
  .never()
  .or(z.any().refine(() => false, { message: "question type not implemented in v1" }));

export const DocumentReviewPayloadSchema = RejectAlways;
export const DocumentReviewAnswerSchema = RejectAlways;
export const BriefBuilderPayloadSchema = RejectAlways;
export const BriefBuilderAnswerSchema = RejectAlways;
export const EthicsPayloadSchema = RejectAlways;
export const EthicsAnswerSchema = RejectAlways;
export const ClientCounselingPayloadSchema = RejectAlways;
export const ClientCounselingAnswerSchema = RejectAlways;

export class GradingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GradingError";
  }
}
