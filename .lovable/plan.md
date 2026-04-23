

# The Bar — Open Preview, Gate Submission

Currently anyone hitting `/the-bar`, `/the-bar/browse`, or `/the-bar/challenge/:id` while logged out gets bounced to `/auth`. Change this to: **everything is browsable; only the act of answering requires login**.

## `src/pages/TheBar.tsx`

Replace the logged-out short-circuit with a full dashboard preview:

- Always render hero + stats strip + recent attempts section.
- For logged-out viewers:
  - StatsStrip shows a generic "Trainee · 0 pts · 0% · 0 streak" placeholder (no data fetch).
  - Recent attempts section shows an inline "Sign in to track your attempts" empty card with a "Sign in" button → `/auth`.
  - "Take a Challenge" CTA stays visible and links to `/the-bar/browse` (also public).
  - Hide the "You're #N overall" rank pill (no user → no rank).
- For logged-in viewers: existing behaviour unchanged.
- Drop the early `return` block that blocks the page; keep the small "sign in" hint as a subtle banner above the quick-action row instead of a full-screen takeover.

## `src/pages/TheBarBrowse.tsx`

- Remove the `if (!userId) navigate("/auth")` redirect.
- When logged out: skip the `bar_attempts` and `bar_daily_attempts` queries; just fetch `bar_challenges_student` and render every approved challenge (none filtered out as "attempted").
- Hide the daily-cap banner for logged-out viewers.
- Cards remain clickable → navigate to `/the-bar/challenge/:id` (which now also accepts logged-out viewers).
- Add a small banner at the top for logged-out viewers: "Browsing as guest — sign in to take a challenge" with a "Sign in" button.

## `src/pages/TheBarChallenge.tsx`

- Remove the `if (!userId) navigate("/auth")` redirect; allow page to render the question for logged-out viewers.
- Skip the `bar_attempts` "already attempted" pre-check when logged out.
- Render the question, options, and all renderers normally — the `bar_challenges_student` view already strips correct answers, so no leak.
- The Submit button (and SpeedRound auto-submit) for a logged-out viewer instead opens a small inline "Sign in to submit your answer" modal/card with a CTA to `/auth?next=/the-bar/challenge/:id` so they bounce back here after auth. Disable any actual `submit-bar-attempt` invocation while `userId` is null.
- Add a thin top banner: "Previewing as guest — sign in to submit and earn points."

## `src/pages/TheBarHistory.tsx`

History is intrinsically per-user; for logged-out viewers show a centered card "Sign in to see your attempt history" with a CTA, instead of redirecting. Keep the route accessible.

## `Auth.tsx` redirect handling (light touch)

`/auth` already redirects to `/` after login. Read an optional `?next=` query param and, if present and starts with `/the-bar`, redirect there post-login so the "Sign in to submit" flow returns the user to the same challenge.

## RLS / data access sanity check

All four queries used by these pages are already public-readable for anon:
- `bar_user_stats` — public SELECT (used only when logged in, but safe either way)
- `bar_challenges_student` — must be readable by `anon`. **Verify in implementation**: if the view's grants are `authenticated`-only, the migration step adds `GRANT SELECT ON public.bar_challenges_student TO anon` so logged-out browsing works. If it already includes `anon`, no change needed.
- `bar_attempts` / `bar_daily_attempts` — never queried for anon viewers (code paths skipped).
- `submit-bar-attempt` edge function — already requires JWT; it stays that way as the real security boundary.

If `bar_challenges_student` lacks `anon` SELECT, a one-line SQL migration grants it. The view already filters to `status='approved'` and strips correct answers, so this is safe.

## Files

**Modified**
- `src/pages/TheBar.tsx`
- `src/pages/TheBarBrowse.tsx`
- `src/pages/TheBarChallenge.tsx`
- `src/pages/TheBarHistory.tsx`
- `src/pages/Auth.tsx` (small `?next=` handling)

**Possible new (only if grants check fails)**
- `supabase/migrations/<ts>_grant_bar_view_anon.sql` — single `GRANT SELECT ON public.bar_challenges_student TO anon;`

## Out of scope
Leaderboard page (already public). Admin pages (stay admin-only). No changes to scoring, RLS on attempts, or the edge function — login is still required to actually submit.

## Definition of Done
Logged-out user can hit `/the-bar`, `/the-bar/browse`, and `/the-bar/challenge/:id` without being bounced. They can read every approved challenge and its options. The moment they try to submit, they get an inline sign-in prompt that returns them to the same challenge after auth. History remains gated with a friendly empty state. Logged-in flows unchanged.

