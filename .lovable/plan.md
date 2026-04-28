# Fix: Beta testers hitting "Submission failed"

## What's actually broken

Testers (Suha, Aditi, etc.) successfully claim slots but every submission fails with **"Submission failed"**. The root cause is **not** networking, validation, or the tester's data — it's a Supabase RLS interaction bug in our submit code.

### Diagnosis (confirmed via direct API test)

In `BetaChecklist.tsx` `handleSubmit`:

```ts
const { data: inserted, error } = await supabase
  .from("beta_feedback")
  .insert({...})
  .select("id")          // ← this is the problem
  .maybeSingle();
```

The `.select("id")` after `.insert()` makes PostgREST add `Prefer: return=representation`, which forces Postgres to read the just-inserted row back. That read is checked against the **SELECT** policy on `beta_feedback`, which is admin-only:

```
"Admins can view beta feedback"  USING (is_admin(auth.uid()))
```

For an anonymous/non-admin tester this returns **42501 "new row violates row-level security policy"**. Postgres rolls the insert back atomically, the client sees an error, toast shows "Submission failed", and `beta_feedback` stays empty (verified: 0 real rows in the table).

A minimal insert *without* `.select()` succeeds (verified end-to-end with the anon key).

## The fix

Two small, surgical changes — no schema changes, no policy changes.

### 1. `src/pages/BetaChecklist.tsx` — `handleSubmit`

- Drop `.select("id").maybeSingle()` from the `beta_feedback` insert.
- Drop `feedback_id` from the subsequent `beta_testers` update (we never read it back to admin anyway, and the row is matched via `tester_id` on the feedback row).
- Keep the rest of the flow identical (mark `submitted_at`, clear draft, show success screen).

Resulting shape:

```ts
const { error } = await supabase.from("beta_feedback").insert({
  tester_name: tester.display_name,
  tester_email: tester.email,
  overall_score: score,
  general_notes: generalNotes.trim() || null,
  responses: responses as never,
  user_agent: navigator.userAgent,
  tester_id: tester.id,
});
if (error) throw error;

await supabase
  .from("beta_testers")
  .update({ submitted_at: new Date().toISOString() })
  .eq("id", tester.id);
```

### 2. Database cleanup (one-line migration)

Remove the diagnostic row I created while debugging so the admin dashboard isn't polluted:

```sql
DELETE FROM public.beta_feedback WHERE tester_name = 'diag2';
```

## Why we don't change RLS

Opening a SELECT policy on `beta_feedback` to non-admins would leak everyone's feedback to anyone with the link. The clean fix is client-side: don't ask Postgres to read back a row the tester isn't allowed to see.

## Verification after the fix

1. Open `/beta` in a private window, claim a slot, mark a couple of tasks Pass/Fail, hit Submit.
2. Confirm the success screen appears (no toast error).
3. In `/admin/beta`, confirm the new row shows up under that tester with `submitted_at` set.

## Out of scope

- Aditi already claimed slot #003 with the original 7-row CHECK constraint (now relaxed via the post-wipe migration); slot numbering is fine.
- Screenshot uploads use a different code path and aren't affected.
- The "Indrajeet Singh (You)" WhatsApp note is unrelated — that's the broadcast message I sent.
