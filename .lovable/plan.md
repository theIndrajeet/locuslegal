# The Bar — Student Experience (Prompt 3)

Rebuilds `/the-bar` from placeholder into the full student arena: dashboard, browser, attempt flow, history. One edge function for server-side grading. Zero correct answers ever leave the server before submission.

## Edge function: `submit-bar-attempt`

`supabase/functions/submit-bar-attempt/index.ts` — JWT validated in code (no admin gate; any authenticated user).

Flow:

1. CORS preflight + parse + Zod-validate body (`challenge_id` uuid, `submitted_answer` unknown, optional `time_taken_seconds`).
2. Extract caller from `Authorization` header → 401 if missing/invalid.
3. Service-role client fetches challenge by id. 404 if missing; 403 if `status !== 'approved'`.
4. Pre-check: `bar_attempts` where `user_id=caller AND challenge_id=:id`. If exists → 409 `already_attempted`.
5. Fetch caller's current `bar_user_stats.designation` → `previous_designation`.
6. Grade: inline copies of the 4 per-type Zod payload schemas + grading functions from `src/lib/bar/scoring.ts` (edge functions can't import from `src/`). Call `gradeAttempt(question_type, payload, submitted_answer, points_base)`. On `GradingError` → 400 with message.
7. INSERT `bar_attempts` row (`user_id`, `challenge_id`, `submitted_answer`, `is_correct`, `points_awarded`, `time_taken_seconds`). The existing BEFORE/AFTER triggers handle daily cap, stats, streak, designation, per-area rollup, daily counter.
8. Translate Postgres exceptions: `daily_cap_exceeded` → 429; `challenge_not_approved` → 403; unique violation → 409.
9. Re-fetch `bar_user_stats` for caller → `new_stats` block including `designation_changed = (new !== previous_designation)`.
10. Build `correct_answer_summary` per type (mcq: text of correct option; issue_spotter: comma-joined correct issue texts; speed_round: "X of Y correct" + `per_question` array; jurisdiction: `<jurisdiction> — <reasoning>`).
11. Return `{ is_correct, points_awarded, explanation, correct_answer_summary, per_question?, new_stats: { total_points, accuracy_pct, current_streak, longest_streak, designation, designation_changed, previous_designation } }`.

Manual test cases (listed in top-of-file comment): valid submit, unapproved → 403, resubmit → 409, malformed → 400, unauthenticated → 401, daily cap → 429, rank-up flow returns `designation_changed=true`.

`time_taken_seconds` is self-reported — comment notes honor-system for v1.

## Frontend — pages

`**src/pages/TheBar.tsx**` (replace existing):

- Logged-out: hero + "Sign in to enter The Bar" CTA → `/auth`.
- Logged-in dashboard:
  - Hero: "The Bar — prove you can lawyer" + tagline. No "coming soon" badge.
  - `<StatsStrip />` — 4 cards (designation, total points, accuracy, current streak) + small progress bar "Next rank in N pts" via `pointsToNextRank()`. "Max rank reached" at silk; if accuracy below next tier shows "Lift accuracy to X% to unlock {next rank}".
  - Quick-action: primary "Take a Challenge" → `/the-bar/browse`; secondary "View Full History" → `/the-bar/history`.
  - Recent attempts: last 10 rows via `<AttemptListItem />`. Click → `<AttemptReviewDialog />`. Empty state with browser CTA.
- `usePageMeta` title `"The Bar — {designationLabel} · Locus"`.

`**src/pages/TheBarBrowse.tsx**` (new):

- Two-step query: fetch caller's attempted `challenge_id`s, then fetch approved `bar_challenges` excluding those, ordered by `approved_at DESC`.
- Filter bar (URL-params backed via `useSearchParams`): question_type, area_of_law, difficulty, sort (newest / points desc / difficulty asc).
- Daily cap banner: query `bar_daily_attempts` for today. ≥18 → yellow warning "N attempts left today". =20 → red banner + cards disabled.
- Grid: 3 cols desktop / 1 col mobile of `<ChallengeCard />`. Pagination 30/page (shadcn `Pagination`).
- Empty states for: zero approved, all attempted, filters yield none.

`**src/pages/TheBarChallenge.tsx**` (new) — the attempt flow:

- Fetch challenge by id; 404 if missing or not approved.
- Pre-check `bar_attempts` for prior attempt → redirect to `/the-bar` with toast "already attempted".
- `**stripCorrectAnswer(type, payload)**` runs immediately after fetch; the unstripped payload is never stored in component state. Returns:
  - mcq: `{ options }` (drops `correct_option_id`)
  - issue_spotter: `{ issue_options }` (drops `correct_issue_ids`)
  - speed_round: `{ questions: [{id, prompt}], time_limit_seconds }` (drops `answer`)
  - jurisdiction: `{ options }` (drops `correct_option_id`; jurisdiction + reasoning kept)
- Header: back button, type/area/difficulty badges, "Worth up to {points_base} pts", source citation if present.
- Renders the appropriate `<XRenderer mode="answer" />`. Tracks `time_taken_seconds` via wall-clock from mount.
- Submit calls `supabase.functions.invoke('submit-bar-attempt')`. Disabled state + spinner. Errors → toasts (409, 429, 400, 500). On 200 → swap to `<ResultScreen />`.

`**src/pages/TheBarHistory.tsx**` (new): paginated table (30/page) of caller's `bar_attempts` joined with `bar_challenges` (title, type, area). Click row → `<AttemptReviewDialog />`. Optional filters: correct/incorrect, type, area.

## Frontend — components

`**src/components/bar/StatsStrip.tsx**`: 4 shadcn Cards with `border-2`. Designation card includes Lucide `Scale` icon and the rank progress sub-line.

`**src/components/bar/ChallengeCard.tsx**`: clickable card → `/the-bar/challenge/:id`. Shows type badge (top-left), difficulty badge (top-right), prompt preview (first 100 chars), points (accent, large), area chip, source_citation (italic muted, optional). Hover lift.

`**src/components/bar/AttemptListItem.tsx**`: row with title, type badge, Lucide `Check`/`X` icon (no emoji), points, relative date.

`**src/components/bar/AttemptReviewDialog.tsx**`: shadcn Dialog. Re-fetches the full challenge (RLS allows read of approved challenges) and the user's attempt row. Renders the appropriate renderer in `mode="review"` so submitted answer is highlighted (green if correct, red if wrong) and the correct answer is highlighted green. Shows explanation + points earned.

**Renderers** (`src/components/bar/renderers/`): each accepts `mode: 'answer' | 'review'`, `payload`, optional `submitted` + `correct` for review mode.

- `McqRenderer.tsx`: shadcn `RadioGroup`. Submit disabled until selection.
- `IssueSpotterRenderer.tsx`: shadcn `Checkbox` list, multi-select. Helper text "Select ALL issues present." Always submittable.
- `SpeedRoundRenderer.tsx`: countdown header from `time_limit_seconds`, one sub-question at a time with text input, "Next" button, "Question N of M" progress, no going back. Timer hits 0 → auto-submit current state + "Time's up!" toast. Cleanup interval on unmount/submit.
- `JurisdictionRenderer.tsx`: shadcn `RadioGroup` with `<jurisdiction>` bold + `<reasoning>` muted sub-text per option.

`**src/components/bar/ResultScreen.tsx**`: large card with Lucide `CheckCircle2`/`XCircle`, "Correct!"/"Not quite", animated points count-up. If `designation_changed` → tasteful accent banner "You ranked up to {new}!" (no confetti library — CSS pulse on accent). Shows `correct_answer_summary`, explanation card, mini new-stats strip. Two CTAs: "Another Challenge" → `/the-bar/browse`, "Back to Dashboard" → `/the-bar`. Speed round adds `per_question` table.

## Helpers + constants

`**src/lib/bar/display.ts**` (new):

- `formatDesignation(d)` → `DESIGNATION_LABELS[d]`
- `pointsToNextRank(points, accuracy, current)` → `{ nextRank, pointsNeeded, accuracyBlocker }`
- `getRelativeDateLabel(iso)` → "2h ago" / "3d ago" / "Jan 15"

`**src/lib/bar/constants.ts**` (modify): export `DESIGNATION_ORDER` (trainee → silk array) + `getNextDesignation(current)` helper.

## Routing

`**src/App.tsx**`: add inside existing `<Layout>`:

- `/the-bar` → `TheBar`
- `/the-bar/browse` → `TheBarBrowse`
- `/the-bar/challenge/:id` → `TheBarChallenge`
- `/the-bar/history` → `TheBarHistory`

The existing placeholder `/the-bar` route is replaced.

## Security posture

- Correct answer fields stripped immediately on fetch in `TheBarChallenge.tsx` via `stripCorrectAnswer`. Raw payload discarded; only stripped version enters React state. Verifiable in DevTools / network tab.
- All grading server-side. Edge function never returns the full unstripped payload pre-submission (the GET happens via the Supabase client because the data is needed for rendering the question; only `correct_*` keys leak risk, which is exactly what `stripCorrectAnswer` removes immediately on the client). Note: students with DevTools could intercept the raw client-side fetch — true server-only delivery would require a `get-bar-challenge` edge function. Flagged but deferred unless you want it now.
- Daily cap and one-attempt-per-challenge enforced by DB triggers / unique constraint, not the UI.
- RLS already restricts non-admins to approved challenges; queries also filter explicitly.
- Edge function uses JWT for identity, service role only for server-side reads/inserts.  
  
Good flag. Choose option C ("B-lite"): create a Postgres view `bar_challenges_student` that selects everything from bar_challenges EXCEPT the correct-answer keys inside the payload jsonb. Specifically:
  CREATE VIEW bar_challenges_student AS
  SELECT 
    id, source_id, source_page, source_citation, question_type, area_of_law,
    difficulty, title, prompt, explanation, status, points_base,
    created_by, approved_by, approved_at, created_at, updated_at, ai_generation_id,
    CASE question_type
      WHEN 'mcq' THEN jsonb_build_object('options', payload->'options')
      WHEN 'issue_spotter' THEN jsonb_build_object('issue_options', payload->'issue_options')
      WHEN 'speed_round' THEN jsonb_build_object(
        'time_limit_seconds', payload->'time_limit_seconds',
        'questions', (
          SELECT jsonb_agg(jsonb_build_object('id', q->'id', 'prompt', q->'prompt'))
          FROM jsonb_array_elements(payload->'questions') q
        )
      )
      WHEN 'jurisdiction' THEN jsonb_build_object('options', payload->'options')
      ELSE '{}'::jsonb
    END AS payload
  FROM bar_challenges
  WHERE status = 'approved';
  Grant SELECT on this view to authenticated users. Keep bar_challenges itself RLS-restricted to admins only for SELECT (tighten the existing policy — students now use the view, not the table).
  Updates to frontend:
  - TheBarBrowse.tsx → query bar_challenges_student instead of bar_challenges
  - TheBarChallenge.tsx → query bar_challenges_student
  - AttemptReviewDialog.tsx → needs the full answer, so it stays on bar_challenges BUT only for challenges the user has already attempted. Add a helper: if bar_attempts has a row for (current_user, challenge_id), allow SELECT on bar_challenges. Implement via a new RLS policy on bar_challenges: "Users can read challenges they've attempted." Keep admin-only for everything else.
  Skip stripCorrectAnswer client-side logic since the view handles it. Client just reads and renders — correct answers are never in the response.
  Confirm this before implementing.

## Out of scope (deferred to prompt 4)

Leaderboards, rank badge on `/u/:username`, firm-side discovery, retake cooldowns, push/email reminders, admin attempt audit, types 5–8, AI grading.

## Open question (one)

The PRD strips correct answers **client-side after fetch**, but a determined student can sniff the raw network response from `bar_challenges`. To make answers truly server-only, we'd add a `get-bar-challenge` edge function returning the pre-stripped payload. Want me to:

- **A**: Build it as specified (client-side strip, accepts the small leak window), or
- **B**: Add a `get-bar-challenge` edge function so the raw correct answer never crosses the wire?

Default if you don't reply: **A** (matches your PRD literally).  
  
