# Fix: premium challenges crash on open ("Cannot read properties of undefined")

**Root cause.** The student-facing view `public.bar_challenges_student` only handles `mcq`, `issue_spotter`, `speed_round`, `jurisdiction`. For everything else it returns `payload = '{}'::jsonb`. So when an admin approves a `document_review` / `brief_builder` / `ethics` / `client_counseling` challenge, the live route fetches an empty object and the renderer crashes accessing `payload.spans[0]`, `payload.steps[0]`, etc.

## Migration: extend `bar_challenges_student`

Recreate the view with `CASE` branches for the 4 premium types. Each branch uses `jsonb_build_object` + `jsonb_agg` to expose only the student-safe fields (no `correct_*`, no answer keys). Status filter and grants stay identical.

- **document_review** → `document_html`, `spans`, `categories` (drop `correct_flags`)
- **brief_builder** → `fact_pattern`, `citation`, and `steps` rebuilt per-step:
  - `kind`, `label`, `prompt`
  - `options` (only `id`, `letter`, `title`, `desc`, `meta` — never `correct_option_id`)
  - `blocks` (only `id`, `text` — never `correct_order`)
- **ethics** → `scenario`, `decision_options`, `consequence_text`, `followup_options` (drop `correct_decision_id`, `correct_followup_id`, `model_reasoning`)
- **client_counseling** → `matter`, `transcript`, and `decision_turns` rebuilt to only expose `turn`, `prompt`, `options` (drop `correct_option_id` and `model_followup`)

Existing 4 type branches and the `ELSE '{}'::jsonb` fallback are preserved.

## Frontend guard: `src/pages/TheBarChallenge.tsx`

After the fetch, if `challenge.question_type` is premium and the required key is missing/empty (e.g. `payload.spans`, `payload.steps`, `payload.decision_options`, `payload.decision_turns`), show a clean "This challenge is misconfigured — please contact an admin." state and a back-to-bar button instead of mounting the renderer. This protects against any older approved rows that may still have malformed payloads.

## Acceptance

- Opening any approved `document_review`, `brief_builder`, `ethics`, or `client_counseling` challenge from `/the-bar` loads without console error and renders inside the dark Locus+ shell.
- `correct_*` keys are still absent from the network response (verified by inspecting the `bar_challenges_student` row in DevTools).
- The 4 existing types (`mcq`, `issue_spotter`, `speed_round`, `jurisdiction`) and the admin / preview / review flows remain unchanged.
