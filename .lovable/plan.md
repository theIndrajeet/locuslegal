## Surface follow-up-ready vacancies + allow deletion

Two related improvements to the `/vacancies` page experience.

### 1. Float "time to nudge" cards to the top

In `src/pages/Vacancies.tsx`, change the `live` `useMemo` so that vacancies whose application has reached the follow-up window (state `followup_ready`) are sorted to the front of the live grid. Other live vacancies keep their existing order (status + created_at). Add `appMap` to the memo's dependency list. No styling change — the existing yellow "Draft follow-up" card already stands out.

### 2. Add a delete-application action on the card

When a card is in `applied`, `followed_up`, or `followup_ready` state (i.e. an application exists), show a small ghost X button in the footer-left area of `src/components/vacancies/VacancyCard.tsx`, next to the "Sent / Applied" status text. Clicking it opens a `<AlertDialog>` with this copy:

> **Remove this application?**  
> This will permanently delete your record for **{firm} — {role}**. The follow-up reminder and "Applied" badge will disappear. This cannot be undone.
>
> Buttons: *Cancel* | *Delete permanently* (destructive)

On confirm:
- Call `supabase.from("profile_applications").delete().eq("id", application.id)`.
- Toast success/failure.
- Notify parent via a new `onDeleted?: () => void` prop so `Vacancies.tsx` can call `refreshApplications()` — same callback already wired through `DraftEmailDialog`'s `onSent`.

### Files touched
- `src/pages/Vacancies.tsx` — sort logic + pass `onDeleted={refreshApplications}` to `VacancyCard`.
- `src/components/vacancies/VacancyCard.tsx` — add delete button, AlertDialog, supabase delete call, `onDeleted` prop.

### Out of scope
- No DB migration. `profile_applications` already allows owners to delete (existing RLS on user_id).
- The delete only removes the local tracker row — it does not recall any sent email.
- Archived/closed vacancy cards already hide action buttons; the delete control follows the same rule (only shown on live cards with an application).