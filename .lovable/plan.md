## Why it still says "Closes in 5 days"

Last round I only converted the **Directory teaser strip** (`VacancyTeaserStrip.tsx`) to the live `useCountdown` hook. The screenshot you shared is the **`/vacancies` page**, which renders `VacancyCard.tsx` — that component still uses the old static `formatExpiry()` helper that rounds to whole days, so it stays stuck on "Closes in 5 days" until midnight ticks over.

## Fix

Switch the badge in `src/components/vacancies/VacancyCard.tsx` to the existing `useCountdown` hook so it ticks live, exactly like the Directory teaser.

### Changes

1. **`src/components/vacancies/VacancyCard.tsx`**
   - Import `useCountdown` from `@/lib/useCountdown`.
   - Drop the `formatExpiry` import (no longer used here).
   - Call `const { label, expired } = useCountdown(vacancy.expires_at);` at the top of the component.
   - Drive `isClosed` off `archived || expired` (instead of `tone === "expired"`), so the card flips to the muted "Closed" state the instant the timer hits zero.
   - Replace both `{formatExpiry(vacancy.expires_at)}` usages in the badge with `{label}`.
   - Keep the existing tone logic (`urgencyTone(days)`) for choosing yellow vs. muted styling — `daysLeft` is still the right input for "is this urgent?".

### Resulting badge behaviour (matches Directory)

- More than 1 day left → `5d 03h` (updates every 30s)
- Less than 24 hours → `09h 42m` (updates every 30s)
- Less than 1 hour → `MM:SS` live ticking every second
- At zero → badge becomes `Closed` and the card greys out automatically

No other files need to change — `VacancyTeaserStrip.tsx` is already on the live hook, and `formatExpiry`/`daysLeft` stay in `vacancies.ts` for any other callers.
