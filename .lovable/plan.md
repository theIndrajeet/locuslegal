## Diagnosis

A WhatsApp tester (Anam) clicked **Claim my slot** on `/beta` and got a generic "Something went wrong" toast.

I reproduced it by calling the `claim_beta_slot` RPC directly and got back:

```
HTTP 400
code: 23514
message: new row for relation "beta_testers" violates check constraint "beta_testers_slot_number_check"
```

The `beta_testers` table has a hardcoded constraint:

```
CHECK ((slot_number >= 1) AND (slot_number <= 7))
```

There are already **7 claimed testers**, so the RPC tries to insert slot 8 and Postgres rejects it. Anam was about to be Founding Tester #008 (the screenshot literally previews "#008") and the database refused.

This is a one-time hard cap that was never meant to limit the program — the UI, copy, and slot numbering all assume a rolling counter.

## Fix

### 1. Database migration — remove the cap
`supabase/migrations/<timestamp>_remove_beta_slot_cap.sql`:
- Drop `beta_testers_slot_number_check` (the `<= 7` cap).
- Add `beta_testers_slot_number_positive_check` ensuring `slot_number >= 1` (keeps integrity, removes the upper bound).

No data changes; the existing 7 rows stay as-is. The unique constraint on `slot_number` already prevents duplicates.

### 2. Better error surface in the UI
`src/pages/BetaChecklist.tsx` → `handleClaim` catch block:
- Replace the generic `"Something went wrong"` toast with an error mapper that reads the actual Postgres message and shows a useful description (e.g., "All slots are full right now" / "Please add your name").
- Log the raw error to the console so future failures are easy to diagnose.

No schema changes elsewhere, no RLS changes, no edge-function changes.

## Verification

1. After the migration applies, retry the claim from `/beta` (or hit the RPC directly) — it should return a fresh `beta_testers` row with `slot_number = 8`.
2. Anam can claim. Total claimed should jump to 8.
3. Future failures will show the real reason in the toast instead of "Something went wrong".

## Files changed
- `supabase/migrations/<timestamp>_remove_beta_slot_cap.sql` — drop cap, add `>= 1` check (new file)
- `src/pages/BetaChecklist.tsx` — friendlier error toast in `handleClaim`
