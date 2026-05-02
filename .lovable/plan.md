## Add "NEW" tag for fresh vacancies

Show a bold neobrutalist **NEW** badge on any vacancy whose `posted_at` is within the last **48 hours**, so users can instantly spot freshly added opportunities on `/vacancies`.

### Where it appears
`src/components/vacancies/VacancyCard.tsx` — header row, next to the existing `Job` / `Internship` and `Task required` chips.

### Behaviour
- Compute `isNew = (Date.now() - new Date(vacancy.posted_at).getTime()) < 48h`.
- Hide the badge when the vacancy is `archived` / closed (no point flagging stale items as new).
- Pure derived state from `posted_at` — no DB changes, no admin toggle. The moment a vacancy is inserted via the admin dialog, it shows up tagged automatically; the tag drops off after 48 h on the next render.

### Visual
- Yellow accent fill, black border, hard shadow, uppercase Sora — matches existing chip language.
- Tiny pulsing dot to draw the eye (CSS `animate-pulse`, no new deps).
- Label: `NEW` (zero emojis, per brand rules).

### Helper
Add a small `isFreshVacancy(posted_at, hours = 48)` helper to `src/lib/vacancies.ts` so the threshold is reusable (e.g. later for the `VacancyTeaserStrip` on the homepage if desired).

### Out of scope
- No changes to admin dialog, schema, or notifications (the existing `new-vacancy` transactional email already covers push notification).
- Teaser strip stays untouched unless you want the same badge there — easy follow-up.