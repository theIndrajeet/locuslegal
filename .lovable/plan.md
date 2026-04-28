## Goal

When a signed-in user applies to a vacancy, the card should immediately reflect that state (color + "Applied" marker), the action button should disable itself for **3 days**, and after 72 hours auto-reactivate as **"Draft follow-up"** — generating a polite, AI-written follow-up email referencing the original application.

## Behavior

```text
[Apply] -> click & send email -> [Applied · awaiting reply]   (3 days, disabled)
                                          |
                                72 hrs later
                                          v
                                 [Draft follow-up]   (re-enabled, accent border)
                                          |
                                 click -> follow-up email draft
                                          v
                              [Followed up · 7 May]   (terminal pill)
```

A user can always still re-apply / re-draft from inside the dialog — we only gate the **card's primary CTA** to prevent accidental duplicate cold emails.

## Changes

### 1. Per-user vacancy application lookup (`src/pages/Vacancies.tsx`)

- After loading vacancies, if `userId` is present, fetch the user's `profile_applications` rows whose `firm_name_snapshot` matches any loaded vacancy's `firm_name`. Build a `Map<vacancyId, { appliedOn: string; lastFollowupOn: string | null }>` keyed by vacancy id (matched on firm_name + role).
- Pass this map down to each `VacancyCard` as a new `application` prop.
- Re-fetch (or optimistically update) after the dialog closes so the card transitions instantly.

### 2. `VacancyCard` state-driven CTA (`src/components/vacancies/VacancyCard.tsx`)

Add `application?: { appliedOn: string; lastFollowupOn: string | null }` prop. Compute one of three states:

- **`idle`** — no application logged → existing yellow "Draft application" button.
- **`applied`** — applied within last 3 days (and no follow-up since) → button **disabled**, label "Applied · follow up in N day(s)", green check icon, card gets a soft accent ring (`border-accent/60 bg-accent/5`) instead of the bold yellow shadow.
- **`followup_ready`** — 3+ days since last apply/follow-up → button re-enabled, label "Draft follow-up", uses an outlined accent style + `Mail` icon. Clicking calls `onApply(v, { followup: true })`.
- **`followed_up`** — follow-up sent within last 3 days → disabled, label "Followed up · {date}".

### 3. Follow-up draft mode in `DraftEmailDialog`

- Extend `DraftEmailTarget` with optional `followup?: { originalAppliedOn: string; originalRole: string }`.
- When `followup` is set:
  - Skip the multi-step brief wizard — open directly to the generated draft.
  - Auto-call `generate()` on open with a new payload flag `mode: "followup"`.
  - On send, log a **new** `profile_applications` row only if not already present, OR (preferred) update the existing row's `notes` with a `\n\n--- Follow-up sent on YYYY-MM-DD ---\n` block and bump `status_updated_at` (DB trigger handles `status_updated_at` on status change; we also explicitly stamp it). We use `status = 'sent'` still and store the follow-up timestamp inside `notes` since the schema has no dedicated column.

### 4. Edge function (`supabase/functions/draft-application-email/index.ts`)

- Accept new optional `mode: "initial" | "followup"` and `original?: { applied_on: string; role: string }` in body schema.
- When `mode === "followup"`, swap the system prompt to instruct the model to write a **short, polite, 3-sentence follow-up** that:
  - References the original email date and role naturally ("I wrote to you on …")
  - Reiterates interest in one line
  - Offers to share additional materials
  - Avoids re-pitching the full CV
- Return the same `{ subject, body }` shape so the existing UI just renders.

### 5. Detection helper (`src/lib/vacancies.ts`)

Add a small util `applicationStateFor(vacancy, app, now)` returning `'idle' | 'applied' | 'followup_ready' | 'followed_up'` and `daysUntilFollowup` so the card and any future surfaces share the same logic.

## Out of scope

- No new database columns or migrations — we reuse `profile_applications.notes` to record follow-up timestamps and match by `firm_name_snapshot + role`. (If we later want richer follow-up history, we'd add a `profile_application_followups` table.)
- The Application Tracker page's pill stays as `sent` — only the Vacancies card surfaces the follow-up state. We can extend the tracker in a follow-up task if you want.
