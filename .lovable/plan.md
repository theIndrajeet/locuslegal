## Goal
Turn the static `5D` badge on the Live Vacancies cards (Directory page strip) into a real countdown that ticks down toward the deadline.

## Where it appears
- File: `src/components/vacancies/VacancyTeaserStrip.tsx` — the badge currently rendered as `{d}d` (line 113) inside each vacancy card.

## Behavior
- Show the time remaining until `expires_at` as a live ticking value.
- Format adapts to remaining time so it stays compact inside the small pill:
  - More than 1 day left → `5d 03h` (days + hours, updates every minute)
  - Less than 24 hours → `09h 42m` (hours + minutes, updates every minute)
  - Less than 1 hour → `42:18` (mm:ss, updates every second)
  - Expired → `Closed`
- Urgency tone unchanged (yellow normal, muted "soon" when ≤2 days, expired hidden since the query already filters them out).

## Implementation

1. Add a small hook `useCountdown(expiresAt: string)` (inline in the file, or as `src/lib/useCountdown.ts` if reused later) that:
   - Returns `{ label: string, totalMs: number }`.
   - Uses `setInterval` with a 1s tick when <1h remaining, otherwise 30s tick (cheap, accurate enough).
   - Cleans up on unmount and when `expiresAt` changes.

2. Update `VacancyTeaserStrip.tsx`:
   - Replace `{d}d` with `{label}` from the hook.
   - Keep the existing `Clock` / `AlertTriangle` icon logic based on `urgencyTone(daysLeft(...))`.
   - Slightly widen the pill if needed so `09h 42m` doesn't wrap (use `whitespace-nowrap`).

3. Leave `VacancyCard.tsx` (full Vacancies page) untouched for now — user only flagged the Directory teaser. Confirm in the next turn whether to roll the same countdown out there too.

## Out of scope
- Server-side changes, no schema changes.
- No change to `daysLeft` / `urgencyTone` / `formatExpiry` helpers — only the rendered label changes.
