# Bar dashboard not updating after a submitted attempt

## What I found

I checked the database for the user whose screenshot shows 0 points / "You haven't taken a challenge yet":

- `bar_attempts` has the row from 18:58 (the test they just took) — insert succeeded, edge function returned 200.
- `bar_user_stats` for that user shows `total_attempts=6, total_points=34, accuracy_pct=0, current_streak=0` — the trigger DID update aggregates correctly.
- The `get_bar_dashboard` RPC reads exactly those values.

So the data is in the DB. The dashboard renders zeros only when the RPC fetch silently fails or returns before the new attempt is reflected. There are three real gaps in the current code:

1. **Silent RPC failure → all-zero defaults.** In `src/pages/TheBar.tsx`, if the RPC errors, `stats` stays `null`, falls back to `displayStats` (all zeros), and the user sees the exact "Trainee / 0 / 0.0% / 0 / no attempts" state shown in the screenshot. There's no toast, no retry, no surfaced error.
2. **`bar:stats-updated` event is lost across navigation.** `TheBarChallenge` dispatches the event right after a successful submit, but `TheBar` is unmounted at that moment. When the user navigates back, the listener was never attached in time to receive it.
3. **No same-session "I just submitted" hint.** Even though the component re-mounts on route change and re-runs the fetch effect, there's no guard against a brief read-after-write race or a stale Postgres read replica returning the pre-trigger state. We should refetch shortly after returning if a recent submit was flagged.

## Plan

### 1. Make the dashboard fetch resilient (`src/pages/TheBar.tsx`)
- Stop swallowing RPC errors. On error: keep previous `stats` (don't blank to zero), show a small inline "Couldn't refresh stats — retry" link, and `console.error` with the error code.
- Add a one-shot retry (single re-attempt after ~600ms) before giving up — handles transient network or cold-start issues.
- Drop the 8-second `setLoading(false)` timeout that hides the skeleton while the request may still be in flight; it currently masks slow RPC calls as "no data".

### 2. Persist the "stats need refresh" signal across navigation
- In `TheBarChallenge.tsx`, after a successful submit, also write a flag to `sessionStorage` (e.g. `bar:lastSubmitAt = Date.now()`) in addition to dispatching the event.
- In `TheBar.tsx`'s mount effect, read that flag. If it's set and recent (< 60s), do an extra refetch ~1s after the first one to catch any read-after-write lag, then clear the flag.

### 3. Refetch on React Router navigation (not just window focus)
- Add `useLocation()` to `TheBar.tsx` and include `location.key` in the dashboard-fetch effect dependency array. This guarantees a fresh fetch every time the user navigates back to `/the-bar` (even if React's render layer were to reuse the component instance).

### 4. Verify with the live data
- After deploying, re-query `bar_user_stats` for the affected user to confirm; if any user shows attempts in `bar_attempts` but no row in `bar_user_stats`, run a one-time backfill (insert + recompute aggregates from `bar_attempts`).

## Technical details

Files to edit:
- `src/pages/TheBar.tsx` — error handling, retry, sessionStorage refresh hint, `location.key` dep, remove premature loading timeout.
- `src/pages/TheBarChallenge.tsx` — write `sessionStorage` flag alongside the existing `window.dispatchEvent("bar:stats-updated")`.

No DB migration needed unless the verification step in (4) finds orphaned attempts; in that case I'll add a small backfill migration.

## Out of scope
- Realtime subscription on `bar_user_stats` (heavier, not needed for this fix).
- Changes to `submit-bar-attempt` edge function or trigger logic — both are working correctly per the data check.
