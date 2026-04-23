

# Build the four reserved formats — Locus-styled, screenshot-faithful where it matters

Adopting the screenshot/PPTX **structure & interaction patterns** but rendering through Locus's existing visual system (Sora/Inter typography, neobrutalist black/white/yellow tokens, hard borders + shadows already in `index.css` and `tailwind.config.ts`). No cream paper cards or Apple system fonts from the mocks — those get re-skinned to Locus.

## What we keep from the mocks (structure & UX)

- **Three-zone layout** per challenge: left rail (challenge list + session block) · center content · right control pane (where the format needs it).
- **Header chip row**: back · format chip (yellow) · area chip · difficulty chip (red for HARD) · step indicator · `WORTH N pts` right-aligned.
- **Italic source line** under the header.
- **Footer status strip**: matter context left · `LIVE · RECORDING FOR REVIEW` / `AUTOSAVED · X MIN AGO` / `DILEMMA · Stage X of Y` / `SESSION CLOSED` right.
- **Primary CTA bottom-right**, yellow with arrow.
- **Per-format flows** (4-step Brief Builder, 2-stage Ethics, multi-turn Counseling, click-to-flag Document Review, hit/miss/false-flag review overlay, "WHY YOU LOST POINTS" / "WHY THIS WAS THE RIGHT CALL" blocks).
- **A/B/C/D letter badge cards**, dashed `AWAITING INPUT` placeholder, numbered drag handles for ordering.

## What we re-skin to Locus

- Typography: **Sora** for headings/badges, **Inter** for body — no system fonts.
- Surfaces: **black bg + white-on-black content cards with hard borders** (Locus neobrutalist tokens) instead of cream paper. Document Review's clause card is the one exception — it stays light because legal-text legibility benefits from it; we'll use the existing Locus light surface token, not the mock's `#faf9f5`.
- Borders/shadows: existing `border-2 border-foreground` + hard shadow utility — not the mock's hairline borders.
- Accent: the existing Locus yellow token, not the mock's `#FFC940`.
- Zero emojis, Lucide icons only, dark mode default — per project memory.

## 1. Database migration

```sql
ALTER TABLE public.bar_challenges
  ADD COLUMN grading_config jsonb NOT NULL DEFAULT '{}'::jsonb;
```

The `bar_question_type` enum already includes all four type names — verified via the existing `QuestionType` TS union. No enum change needed unless the linter flags it.

## 2. Schemas — `src/lib/bar/types.ts`

Replace the four `RejectAlways` stubs with real Zod:

```
document_review:  { document_html, spans[{id,text}], categories[{id,label}],
                    correct_flags[{span_id, category_id}] }
                  answer { flagged: [{span_id, category_id}] }

brief_builder:    { fact_pattern, citation,
                    steps[ // 4: Statute · Precedent · Arguments · Rebuttal
                      { kind:"mcq"|"order", prompt,
                        options?[{id,letter,title,desc,meta}], correct_option_id?,
                        blocks?[{id,text}], correct_order? }] }
                  answer { step_answers: [{step_index, selected_option_id? | ordered_block_ids?}] }

ethics:           { scenario, decision_options[{id,letter,text}], correct_decision_id,
                    consequence_text, followup_options[{id,letter,text}],
                    correct_followup_id, model_reasoning }
                  answer { selected_decision_id, selected_followup_id }

client_counseling:{ matter, transcript[{turn, role:"client"|"lawyer", text}],
                    decision_turns[{turn, prompt, options[{id,letter,text}],
                                    correct_option_id, model_followup}] }
                  answer { turn_picks: [{turn, selected_option_id, followup_text?}] }
```

Ethics is **2-stage MCQ** (Decision → Consequence) per the screenshots, not MCQ + free text. Counseling is **multi-turn** (5 turns).

## 3. Constants — `src/lib/bar/constants.ts`

Rename `V1_QUESTION_TYPES` → `ENABLED_QUESTION_TYPES`, include all 8.

## 4. Scoring — `src/lib/bar/scoring.ts` (deterministic only)

- `gradeDocumentReview` — correct flag w/ right category +1, false flag −1, miss/wrong-category 0; clamp ≥ 0; scale to `pointsBase`.
- `gradeBriefBuilder` — per step: MCQ exact; Arguments exact order (or Kendall-tau partial credit when `grading_config.partial_order_credit`); overall `is_correct` = all steps correct.
- `gradeEthics` — both stages must match; half credit if only Stage 1 correct.
- `gradeClientCounseling` — per-turn pick ratio scaled to `pointsBase`; `is_correct` = ≥ 80% turns correct. Free-text followups graded server-side.

`gradeAttempt` switch dispatches all four.

## 5. Shared shell — `src/components/bar/ChallengeShell.tsx`

Locus-skinned implementation of the mock's three-zone shell:

- **Left rail**: `Locus.` wordmark (with yellow `.`), `THE BAR · RESEARCH PREVIEW`, numbered challenge list (active row = yellow border + hard shadow), session footer (`student · {username}`, `streak · Xd`, `rank · #N / total` from `bar_user_stats`).
- **Header chip row**: back (Lucide `ChevronLeft`) · format chip (yellow, Sora) · area chip · difficulty chip (red on HARD) · step indicator · `WORTH N pts` right-aligned.
- **Italic source line** under header.
- **Footer strip**: matter left · status right (`LIVE · RECORDING FOR REVIEW` / `AUTOSAVED · Xm AGO` / `DILEMMA · Stage X of Y` / `SESSION · CLOSED`).
- **Primary CTA** bottom-right slot via `cta` prop.
- `showStateBar` prop (admin/preview only) for the dev step indicator.

Used by all four new renderers; retrofittable to MCQ/Issue Spotter/Speed Round/Jurisdiction in a follow-up.

## 6. Renderers — `src/components/bar/renderers/`

All follow the existing `mode: "answer" | "review"` contract.

- **DocumentReviewRenderer.tsx** — content card with inline `<mark>` spans; click span → category chip popover → stores `(span_id, category_id)`. Review overlays: green underline (correct hit), red underline (missed), dashed yellow (false flag), plus `WHY YOU LOST POINTS` block. State chips (`BASE · X FLAGGED`, `EMPTY`, `GRADING`, `RESULT`) rendered via shell's state bar in admin mode.
- **BriefBuilderRenderer.tsx** — split: fact-pattern card on left, right pane shows 4-step progress pills (`Statute · Precedent · Arguments (Drag) · Rebuttal`). Steps 1/2/4 = A/B/C/D MCQ cards (letter badge · title · desc · citation meta). Step 3 = vertical `@dnd-kit/sortable` list with drag handle + `01…05` numbering. Result view: `N / 40 pts` summary card with per-step CORRECT/WRONG rows + `TRIAL NOTES` block.
- **EthicsRenderer.tsx** — 2-stage horizontal stepper (`1 YOUR DECISION → 2 THE CONSEQUENCE → 3 REVEAL`). Lucide `Scale` icon on the situation card. Stage 1: A/B/C/D options. Stage 2: shows `STAGE 1 · YOU CHOSE` recap + new situation + `What now?` A/B/C/D. Result: `N / 25 pts` + green-bordered Stage 1 + Stage 2 blocks + yellow `WHY THIS WAS THE RIGHT CALL` reveal w/ `model_reasoning`.
- **ClientCounselingRenderer.tsx** — chat transcript (client = neutral border, lawyer = yellow border, dashed `AWAITING INPUT`). Right pane per turn: `How do you respond?` + A/B/C/D response cards (selected = yellow border) + `Send Response →`. Result: `N / 35 pts` + per-turn green/red checks + `CONSULTATION REVIEW · 5 TURNS` + `Next Sim →`.

Wire into `src/pages/TheBarChallenge.tsx` and `src/components/bar/AttemptReviewDialog.tsx` (extend existing switches).

## 7. Backend grading — `supabase/functions/submit-bar-attempt/index.ts`

Four new branches mirroring client logic. For Ethics + Client Counseling, after deterministic grading, call Lovable AI Gateway (`google/gemini-2.5-flash`) with tool-calling:

```
{ rubric_score: 0-100, strengths: string, weaknesses: string,
  per_turn_feedback?: [{turn, note, ok:boolean}] }
```

`is_correct` = deterministic correct AND `rubric_score ≥ grading_config.reasoning_threshold` (default 60). Points = `floor(pointsBase * (0.5 * deterministicRatio + 0.5 * rubric_score/100))`. Surface 429 / 402 cleanly to the toast on the client.

Response extended: `rubric_score`, `rubric_feedback`, `per_turn_feedback`, `correct_order`, `correct_flags` for review mode.

## 8. Admin authoring — `src/components/admin-bar/ChallengeForm.tsx`

Four new editor sections behind the `type` select:

- **Document Review**: passage editor (HTML) · repeatable spans (text · category · is-correct-flag) · category list editor.
- **Brief Builder**: 4 tabs (`Statute · Precedent · Arguments · Rebuttal`) — 1/2/4 are A/B/C/D editors with citation meta; Arguments is a sortable block editor + `partial_order_credit` toggle.
- **Ethics**: A/B/C/D Stage 1 + `consequence_text` + A/B/C/D Stage 2 + `model_reasoning` textarea.
- **Client Counseling**: `matter` field + repeatable transcript turns (role · text) + per-decision-turn A/B/C/D editor + `model_followup`.

Update AI helpers — `extract-questions-from-pdf` and `draft-question-from-prompt` — with four new tool-calling schemas so admins can auto-populate from PDF/prompt.

## 9. Rit context — `supabase/functions/rit-chat/index.ts`

Extend `correctSummary` with four new branches so Rit can explain Brief Builder ordering, Document Review missed flags, Ethics two-stage logic, and Counseling per-turn gaps. No schema change.

## 10. Preview demos — `src/pages/TheBarPreview.tsx`

One synthetic example per new format, all client-graded (no auth, no edge call):

- Brief Builder: exact `Priya v. QuickMart (2024)` content from the screenshots.
- Document Review: NDA excerpt with 5 flaggable clauses (3 should-flag + 2 distractors), matching the result view.
- Ethics: BCI environmental-violations dilemma from the screenshots.
- Client Counseling: `Srinivasan — Labour / Retaliation` 5-turn consult from the screenshots.

## 11. New dependency

`@dnd-kit/core` + `@dnd-kit/sortable` for Brief Builder.

## Files

**New**
- `src/components/bar/ChallengeShell.tsx`
- `src/components/bar/renderers/DocumentReviewRenderer.tsx`
- `src/components/bar/renderers/BriefBuilderRenderer.tsx`
- `src/components/bar/renderers/EthicsRenderer.tsx`
- `src/components/bar/renderers/ClientCounselingRenderer.tsx`
- `supabase/migrations/<ts>_bar_grading_config.sql`

**Modified**
- `src/lib/bar/types.ts`, `scoring.ts`, `constants.ts`
- `src/components/admin-bar/ChallengeForm.tsx`
- `src/pages/TheBarChallenge.tsx`, `TheBarPreview.tsx`
- `src/components/bar/AttemptReviewDialog.tsx`
- `supabase/functions/submit-bar-attempt/index.ts`
- `supabase/functions/rit-chat/index.ts`
- `supabase/functions/extract-questions-from-pdf/index.ts`
- `supabase/functions/draft-question-from-prompt/index.ts`

## Phasing

1. Migration + schemas + scoring + constants.
2. `ChallengeShell` + 4 renderers + preview demos (playable client-side).
3. Edge function grading (deterministic + AI rubric).
4. Admin authoring + AI extract/draft schemas.
5. Rit context branches.
6. Smoke test: author one of each in admin → attempt → review → chat with Rit.

## Definition of Done

- All 8 question types authorable and playable end-to-end.
- Renderers structurally match the mocks (header chips, A/B/C/D letter badges, dashed `AWAITING INPUT`, numbered drag handles, 2-stage Ethics with Scale icon, green/red/dashed-yellow review overlay, `WHY YOU LOST POINTS` / `WHY THIS WAS THE RIGHT CALL` blocks) but visually rendered through Locus's existing tokens (Sora/Inter, black bg, hard borders + shadows, yellow accent).
- Ethics + Client Counseling return AI rubric score + per-turn feedback within ~5s and block "correct" unless deterministic AND rubric pass.
- Brief Builder supports 4-step progress with drag-to-order on Arguments and optional partial credit, autosave indicator in footer.
- Document Review supports click-to-flag with category chips and shows hit / miss / false-flag overlay in review.
- `/the-bar/preview` demos all 4 new formats without auth.
- No regression to MCQ / Issue Spotter / Speed Round / Jurisdiction.

