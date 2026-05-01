## Goal

Two things, in order:
1. **Pause "new Bar challenge" email notifications** so a bulk question drop doesn't spam every user with one email per question.
2. **Bulk insert** the JSON questions you paste — straight into `bar_challenges` as `approved`, no notifications fired.

---

## Step 1 — Pause Bar challenge notifications

The trigger `bar_challenges_notify_new_after_iu` on `public.bar_challenges` is what fires `dispatch-content-notification` whenever a row becomes `status = 'approved'` with `notified_at IS NULL`.

I'll run a migration that **disables only that trigger** (vacancy notifications stay live, since they're on a different table):

```sql
ALTER TABLE public.bar_challenges
  DISABLE TRIGGER bar_challenges_notify_new_after_iu;
```

This is reversible with a one-line `ENABLE TRIGGER` later when you want to resume per-question emails (or never — you may prefer a weekly digest instead).

As an extra belt-and-suspenders, the bulk insert below also pre-stamps `notified_at = now()` so even if something re-enables the trigger mid-run, it short-circuits on the `notified_at` guard inside the edge function.

---

## Step 2 — You paste, I insert

You paste the JSON array of questions in your next message. The shape per item must match what the app expects (from `src/lib/bar/types.ts` + the spec I gave you earlier):

```json
{
  "title": "…",
  "question_type": "mcq | issue_spotter | speed_round | jurisdiction | document_review | brief_builder | ethics | client_counseling",
  "area_of_law": "constitutional | criminal | contract | …",
  "difficulty": "easy | medium | hard",
  "points_base": 10,
  "scenario": "…optional fact pattern…",
  "explanation": "…why the correct answer is correct…",
  "payload": { /* type-specific shape per the spec */ },
  "source_ids": []   // optional, omit if none
}
```

I'll then:

1. Validate every item locally against the Zod schemas in `src/lib/bar/types.ts` so we catch malformed payloads **before** touching the DB.
2. Insert all valid rows in one migration via `INSERT … VALUES …` with:
   - `status = 'approved'`
   - `approved_at = now()`
   - `notified_at = now()` (notification skip-guard)
   - `created_by = <your admin uid>` (I'll look it up from `user_roles` where `role='admin'`)
3. Report back: how many inserted, how many skipped, with reasons for any skips.

If any item fails validation, I'll list it with the exact error and **not** insert it — you fix it and re-paste just the bad ones.

---

## Step 3 — Resume notifications later (optional, your call)

When you're done bulk-posting and want emails to resume:

```sql
ALTER TABLE public.bar_challenges
  ENABLE TRIGGER bar_challenges_notify_new_after_iu;
```

Just say the word.

---

## What I need from you

Paste the JSON array of questions in your next message. Could be 5, could be 200 — same flow either way.
