

# Fix-up: open-preview audit nits

Three small issues from the prior audit. All cosmetic/UX — no schema or security changes.

## `src/pages/TheBarChallenge.tsx`

- Add a thin top banner above the question card, only when `!userId`: "Previewing as guest — sign in to submit and earn points." with a "Sign in" button → `/auth?next=/the-bar/challenge/{id}`.
- Replace the current hard-redirect-on-submit with an inline guard: when a guest clicks Submit (or the SpeedRound timer auto-submits), open a small shadcn `AlertDialog` "Sign in to submit your answer" with two buttons: "Sign in" → `/auth?next=/the-bar/challenge/{id}`, and "Cancel". The `submit-bar-attempt` invocation stays gated behind `userId`.
- Remove stale comments referencing the old auth redirect.

## `src/pages/TheBarBrowse.tsx`

- Fix the empty-state copy. When `!userId` and zero results, show "No challenges match your filters." (never "You've attempted every available challenge", which is meaningless for guests).
- For logged-in users keep the existing "attempted everything" copy only when no filters are applied AND result set is empty AND attempted-set is non-empty; otherwise fall back to the generic "no matches" string.

## `src/pages/Auth.tsx`

- Tighten `safeNext`: only accept paths that start with `/the-bar` (per the original PRD). Anything else → fall back to default `/the-bar`. Keeps the open-redirect surface narrow.

## Files

**Modified**
- `src/pages/TheBarChallenge.tsx`
- `src/pages/TheBarBrowse.tsx`
- `src/pages/Auth.tsx`

## Out of scope
No DB changes. No new components beyond using existing shadcn `AlertDialog`. No changes to logged-in flows, the edge function, or RLS.

## Definition of Done
Guest on `/the-bar/challenge/:id` sees the preview banner and gets an inline sign-in dialog (not a hard redirect) on submit. Browse empty state reads correctly for guests. `?next=` only honors `/the-bar*` paths.

