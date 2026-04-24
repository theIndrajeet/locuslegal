# Locus+ audit fixes — execution plan

Four targeted hardening passes. No new features, no UX regressions.

## 1. Type safety: mark answer-key fields optional in payload types

The student view strips all `correct_*` / `model_*` keys, so when these payloads are typed as **required** the TS types lie about what arrives at runtime. Fix the four interfaces so the answer-mode code paths compile honestly and any future use of these fields outside `review` mode is forced to null-check.

**`src/components/bar/premium/PremiumEthics.tsx`** — `EthicsPayload`:
- `correct_decision_id?: string`
- `correct_followup_id?: string`
- `model_reasoning?: string`
- In `RevealPane` (review-only), guard `payload.model_reasoning` render with `&&` so it's hidden when missing.
- In `RevealPane` correctness checks, fall back to `""` when the correct id is absent (treat as "no key → can't be correct"), so the row still renders rather than crashing.

**`src/components/bar/premium/PremiumClientCounseling.tsx`** — `CounselingDecisionTurn`:
- `correct_option_id?: string`
- (`model_followup` already optional — leave as is)
- Review block: when `dt.correct_option_id` is missing, treat the pick as "ungraded" (neutral border, no ✓/✗) instead of crashing.

**`src/components/bar/premium/PremiumBriefBuilder.tsx`** — `BriefStep`:
- Already has `correct_option_id?` and `correct_order?` optional. ✅ No change.

**`src/components/bar/renderers/DocumentReviewRenderer.tsx`** — `Payload`:
- `correct_flags?: CorrectFlag[]` (optional)
- In `correctMap` builder: `const list = props.mode === "review" ? props.correct_flags : (payload.correct_flags ?? []);` — this is the actual P0 line that would crash if a legacy renderer ever loaded a stripped payload in answer mode.

**`src/components/bar/premium/PremiumDocumentReview.tsx`** — `Payload`:
- `correct_flags?: CorrectFlag[]` (optional)
- Same `?? []` defense in `correctMap` builder.

## 2. Brief Builder review duplicates the shell — render once

In `src/components/bar/AttemptReviewDialog.tsx`, the `brief_builder` branch maps over every step and instantiates `<PremiumBriefBuilder>` once per step. Each instance re-renders the entire 2-column shell (sticky fact card + stepper), so a 4-step brief shows the fact card 4 times stacked vertically and looks broken.

**Fix.** Render a single `<PremiumBriefBuilder mode="review" currentStep={0} ...>` and add a small reviewer-only step picker above it (lightweight buttons "Step 1 / Step 2 / …") that swaps `currentStep` via local `useState`. This keeps every other surface area (preview, live, admin) untouched.

## 3. AI generation: validate `{{span_id}}` markers and id refs

Both `extract-questions-from-pdf` and `draft-question-from-prompt` accept `document_review` / `brief_builder` / `ethics` / `client_counseling` payloads but only check shape, not referential integrity. So a hallucinated marker like `{{loud-clause}}` with no matching span silently slips through and renders a literal `loud-clause` string in the document.

Add `.refine()` to the four schemas in **both** edge functions (identical code, copy-paste):

**`DocumentReviewPayloadSchema`**
- Every `{{id}}` marker in `document_html` must match a span id, and every `correct_flags[].span_id` / `category_id` must reference a real span / category.

**`BriefBuilderPayloadSchema`**
- Per step: if `kind="mcq"` then `options` ≥ 2, `correct_option_id` matches one option id.
- Per step: if `kind="order"` then `blocks` ≥ 2, `correct_order.length === blocks.length`, every id in `correct_order` references a real block id.

**`EthicsPayloadSchema`**
- `correct_decision_id` exists in `decision_options`; `correct_followup_id` exists in `followup_options`.

**`ClientCounselingPayloadSchema`**
- For each `decision_turns[i]`: `correct_option_id` exists in that turn's `options`.

`validatePayload` already calls `.safeParse(...).success`, so a failing refine simply rejects the AI-generated row before it lands as a draft. No further wiring needed.

## 4. View hardening: `security_invoker` + `security_barrier`

Recreate `public.bar_challenges_student` with the same body (the one we shipped this morning) but add `WITH (security_invoker = true, security_barrier = true)`. This makes the view honor the calling user's RLS on the underlying `bar_challenges` table (defense in depth — if a future RLS change ever permits broader read on the base table, the view inherits it correctly instead of bypassing as definer). Idempotent migration: `DROP VIEW IF EXISTS … CASCADE` + `CREATE VIEW …`.

## Out of scope (explicitly skipped)

- AttemptReviewDialog re-fetch / caching — trivial perf, not worth a refactor right now.
- Adding `model_reasoning` / `model_followup` back to the student view — they're admin-only commentary, students should never see them pre-submission, and post-submission they'd be useful but they aren't currently wired into any post-grade UI; tracked as a future enhancement, not a bug.
- Renderer-level fallback UI for missing `correct_*` in review mode — the new payload types and `?? []` defenses are enough; if an old malformed row sneaks through the misconfig guard in `TheBarChallenge.tsx` already covers it.

## Acceptance

- TS compiles after marking the four payload `correct_*` fields optional; no `as any` added.
- Approving a `brief_builder` challenge and opening its attempt in the review dialog shows **one** sticky fact card with a step picker, not four stacked shells.
- Generating a `document_review` via PDF extract or AI draft where the model invents an unmatched `{{marker}}` returns 0 challenges (rejected by refine), surfaced normally in the AI generations log.
- `\d+ public.bar_challenges_student` shows `security_invoker = on, security_barrier = on`. Existing student fetches still return identical JSON.
- All 4 existing types and admin/preview/live/review flows unchanged.
