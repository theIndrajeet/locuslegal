You’re right. I treated vacancies like the new generic opportunity cards, and that broke the existing vacancy-specific flow. I’ll restore that system instead of replacing it.

Plan:

1. Restore the vacancy application workflow on `/opportunities`
   - For `internship` and `job` items, render the existing `VacancyCard` component again.
   - This brings back:
     - `Draft application`
     - draft email dialog
     - automatic Application Tracker logging
     - applied/follow-up state badges
     - `Draft follow-up`
     - remove tracker record button
     - inline task brief display
   - Vacancy cards will no longer use the generic “View details / Email application” modal path.

2. Reconnect vacancy tracking state
   - Re-add the signed-in user application lookup from `profile_applications`.
   - Match existing tracker rows to vacancies by firm and role, using the previous loose matching logic.
   - Refresh application state after a draft is sent, so the card immediately updates to “Applied” / follow-up state.

3. Keep the “no expired opportunities” rule
   - Keep vacancies, CFPs, moots, and competitions filtered to `status = live` and deadline greater than now.
   - I will not bring back the “recently closed / archived last 30 days” section.

4. Keep the CFP/detail modal improvements only where they belong
   - For CFPs, moots, and competitions, keep the detail modal.
   - Add the yellow top “Important links” panel there, not as a replacement for vacancy drafting.
   - Show both links when available:
     - submission / registration / application link
     - brochure / guidelines link
   - Make both visually prominent with yellow accent treatment at the top.

5. Fix the source clipping
   - Add enough bottom padding inside the detail modal scroll area.
   - Reduce/remove the fade overlap so `Source: ...` is fully visible.

Technical details:

- Update `src/pages/Opportunities.tsx` only.
- Import and use:
  - `VacancyCard`
  - `DraftEmailDialog`
  - `useAuthSession`
  - vacancy types from `@/lib/vacancies`
- Split rendering logic:
  - Career group (`internship`, `job`) uses `VacancyCard` with `onApply`.
  - Academic/contest streams use the generic `OpportunityCard` + `DetailDialog`.
- No database schema changes.
- No changes to existing vacancy records.
- No changes to the email draft component itself unless a type mismatch requires a tiny integration fix.