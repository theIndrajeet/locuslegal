

# Fix `suggest-topics` edge function

The function fails with a 500 because of two DB constraint mismatches and a fragile placeholder-source workaround. Here's the fix.

## Root causes

1. **CHECK constraint blocks our log row.** `bar_ai_generations_generation_type_check` only allows `'pdf_extract_single' | 'pdf_extract_batch' | 'topic_draft'`. We insert `'topic_suggest'` → constraint violation → 500.
2. **`source_id` is `NOT NULL`** on `bar_ai_generations`, so we created a throwaway "AI batch" placeholder source just to satisfy the FK. Then we delete it at the end — but the FK is `ON DELETE CASCADE`, so the delete also wipes the log row we just finalized. A successful run leaves no audit trail, and any failure path is brittle.
3. Minor: client toast says only "Edge Function returned non-2xx status code" because we don't surface the JSON `error` field from a failed `functions.invoke` call.

## Database migration

Single migration that:

- Drops `bar_ai_generations_generation_type_check` and re-adds it with `'topic_suggest'` included:
  ```
  ('pdf_extract_single', 'pdf_extract_batch', 'topic_draft', 'topic_suggest')
  ```
- Makes `bar_ai_generations.source_id` nullable so batch/topic-suggest runs don't need a fake source.

No data migration needed — existing rows all have a `source_id`.

## Edge function rewrite (`supabase/functions/suggest-topics/index.ts`)

- Remove the placeholder-source dance entirely.
- Insert the log row with `source_id: null` upfront.
- On success, insert the N real `bar_sources` rows directly and return their IDs.
- On any failure, just `finalizeLog` with the right outcome — no cascade gotchas.
- Keep the same auth, rate-limit-via-log, AI gateway call, JSON parsing, refusal handling, and 429/402 surfacing.

## Client polish (`AiSuggestTopicsDialog.tsx`)

When `supabase.functions.invoke` returns `{ error }`, also try to read `error.context.body` (the JSON returned by the function) so toasts show the real reason ("AI declined: …", "Rate limited — try again shortly.", etc.) instead of the generic "non-2xx" message. Same pattern other dialogs in the project should already use; align with `AiDraftDialog` if it does this.

## Files

**Modified**
- `supabase/functions/suggest-topics/index.ts` — drop placeholder source; insert log with `source_id = null`.
- `src/components/admin-bar/AiSuggestTopicsDialog.tsx` — surface real error message from edge function.

**New**
- `supabase/migrations/<timestamp>_bar_ai_generations_topic_suggest.sql` — extend CHECK + relax NOT NULL on `source_id`.

## Out of scope

No changes to RLS, the Draft flow, the AI prompt content, or any other edge function.

## Definition of Done

- Click **AI Suggest Topics → Surprise me → Generate** with the current settings (5, IP, hard, user_submitted) → toast `Created 5 topic source(s)`, 5 new rows in the Sources table, each ready for the **Draft** action.
- AI refusals show a clear message ("AI declined: …"), not "non-2xx".
- The `bar_ai_generations` table has one new row per attempt with `generation_type = 'topic_suggest'`, `source_id = NULL`, and `outcome = 'success' | 'validation_fail' | …`.

