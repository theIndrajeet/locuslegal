

# The Bar — AI Question Authoring (Prompt 2)

Adds the AI authoring layer on top of prompt 1's foundation. Two edge functions, one schema migration, five UI changes. Zero AI output reaches students without admin approval.

## Schema migration

One migration file:

- **New table `bar_ai_generations`**: provenance log per spec (id, source_id FK→bar_sources CASCADE, generation_type CHECK, requested_by FK→profiles RESTRICT, hint columns, model, token counts, outcome CHECK, error_message, challenges_created, duration_ms, created_at). Indexes on source_id, requested_by, created_at DESC, outcome.
- **RLS on `bar_ai_generations`**: admin-only SELECT/UPDATE/DELETE via `is_admin(auth.uid())`. No INSERT policy — only the service role (edge function) writes.
- **`bar_challenges` add column** `ai_generation_id uuid NULL REFERENCES bar_ai_generations(id) ON DELETE SET NULL` + index.

## Edge function: `extract-questions-from-pdf`

`supabase/functions/extract-questions-from-pdf/index.ts` — `verify_jwt = true` (default); JWT is also revalidated in code.

Flow:
1. CORS preflight + parse + Zod-validate body (`source_id`, `mode`, optional `batch_size` 1–20 default 10, optional hints).
2. Extract caller from `Authorization` header → reject 401 if missing. Use service-role client to query `user_roles` for admin role → 403 if not admin.
3. Fetch source row. Verify exists (404) and `source_type='pdf_extraction'` (400 otherwise).
4. INSERT `bar_ai_generations` row (outcome temporarily `'ai_error'` placeholder, updated at end). Capture `generation_id`.
5. Download PDF from `bar-sources` bucket via service-role storage client (`download(storage_path)`). On failure → update log `outcome='ai_error'`, return 404.
6. Convert PDF bytes to base64 data URL (`data:application/pdf;base64,...`) and send via Lovable AI Gateway as a multimodal message (image_url-style attachment, same pattern as parse-cv).
7. Build system prompt per PRD with conditional hint blocks. For `mode=single`, instruct "Return exactly 1 item." For `mode=batch`, substitute `{BATCH_SIZE}`.
8. POST to `https://ai.gateway.lovable.dev/v1/chat/completions` with `model: google/gemini-3-flash-preview`. Capture `usage.prompt_tokens`/`completion_tokens`. Handle 429 → log `rate_limit`, return 429. Handle 402 → log `quota_exceeded`, return 402.
9. Strip ```json fences, parse. On parse fail → log `parse_fail`, return 500 retryable.
10. Filter to v1 question types only. For each, validate `payload` against the question-type-specific Zod schema (schemas inlined in the function file — edge functions can't import from `src/`).
11. If 0 valid → log `validation_fail`, return 422. Otherwise insert each as `bar_challenges` with status=`draft`, `source_id`, `source_page` from AI, `source_citation` = `"Adapted from {source.title}, page X"` (or without page if null), `ai_generation_id`, `created_by` = caller, `points_base` computed via inlined `computeBasePoints` (constants duplicated).
12. UPDATE log row with `outcome='success'`, `challenges_created`, token counts, `duration_ms`.
13. Return `{ generation_id, challenges_created, challenge_ids }`.

Manual test cases listed in a top-of-file comment block per PRD.

## Edge function: `draft-question-from-prompt`

`supabase/functions/draft-question-from-prompt/index.ts` — same auth/CORS pattern.

Flow: validate body (`source_id`, `question_type`, `area_of_law`, `difficulty`); admin check; verify source is `topic_prompt` type; INSERT log row with `generation_type='topic_draft'`; build prompt substituting topic text + parameters; call gateway (no PDF attachment); parse JSON object; if `{ refused: true, reason }` → log `validation_fail` with reason, return 422 with that reason; else Zod-validate against the requested type's schema; INSERT one `bar_challenges` row with `source_citation = "Drafted from topic: {source.title}"`, `source_page=null`; update log; return `{ generation_id, challenge_id }`.

## Frontend

**`src/components/admin-bar/AiExtractDialog.tsx`** (new): single component handling both `mode='single'` and `mode='batch'` via prop. Form: optional type/area/difficulty selects; for batch, `batch_size` number input (1–20). Submits via `supabase.functions.invoke('extract-questions-from-pdf', { body })`. Shows sonner toast `"AI is working… this may take 10–45s"`. On success: toast with "Review drafts" action that navigates to `/admin/bar?tab=challenges&generation_id=...`. On error: surface message; show "Try again" if status >= 500 or 429.

**`src/components/admin-bar/AiDraftDialog.tsx`** (new): required selects for question_type (4 v1 types), area_of_law, difficulty. Same toast/navigation pattern; calls `draft-question-from-prompt`.

**`src/components/admin-bar/AiGenerationsLog.tsx`** (new): paginated table reading `bar_ai_generations` with join on `bar_sources(title)` and `profiles(username)`. Columns per PRD; outcome badge color-coded; error_message in tooltip on hover. Sort created_at desc.

**`src/components/admin-bar/SourceLibrary.tsx`** (modify): per-row action buttons. PDF rows get "Extract 1" + "Extract Batch" (Lucide `Sparkles` icon, no emoji per project memory). Topic-prompt rows get "Draft". Local `generatingSourceId` state disables buttons during invocation.

**`src/components/admin-bar/ChallengesTable.tsx`** (modify): new "Origin" column rendering Manual / AI PDF / AI Topic outline badges (derived via join to `bar_sources.source_type` through `ai_generation_id → source_id`, fetched in the same query). Origin filter dropdown. Read `?generation_id=` from `useSearchParams` and pre-filter. AI-drafted rows show a small `Sparkles` icon next to the title with a tooltip "AI-generated from {source.title} · {date}". View/Edit dialog gains a read-only "Source trail" block with source title, page, citation, generation date, model, outcome.

**`src/components/admin-bar/ChallengeForm.tsx`** (modify): add optional `existingChallenge` prop. When provided, pre-fill all fields and submit calls UPDATE instead of INSERT. Manual create path untouched.

**`src/pages/AdminBar.tsx`** (modify): add fourth `TabsTrigger` "AI Log" rendering `<AiGenerationsLog />`. Tabs become controlled to honor `?tab=` query param.

## Soft rate limit

Both dialogs, before invoking the function: query `bar_ai_generations` count where `requested_by = current user` AND `created_at > now() - 60min`. If >= 20, show info toast and block. Defense in depth only; not a security boundary.

## Security checklist

- Both functions revalidate the JWT and the admin role server-side; do not trust client.
- Source ownership/type check before any AI call.
- `LOVABLE_API_KEY` only used inside functions; never sent in responses.
- PDF bytes fetched via service-role storage client; no signed URLs handed to the browser.
- Logs store metadata only (token counts, outcome, error message) — never the PDF content or full AI output.
- New table RLS: admin SELECT/UPDATE/DELETE only; service role inserts via the function (RLS bypass).
- Every AI item passes Zod before insert; failed items skipped.

## File map

**New**
- `supabase/functions/extract-questions-from-pdf/index.ts`
- `supabase/functions/draft-question-from-prompt/index.ts`
- `supabase/migrations/<timestamp>_bar_ai_generations.sql`
- `src/components/admin-bar/AiExtractDialog.tsx`
- `src/components/admin-bar/AiDraftDialog.tsx`
- `src/components/admin-bar/AiGenerationsLog.tsx`

**Modified**
- `src/components/admin-bar/SourceLibrary.tsx`
- `src/components/admin-bar/ChallengesTable.tsx`
- `src/components/admin-bar/ChallengeForm.tsx`
- `src/pages/AdminBar.tsx`

## Out of scope
Student UI, attempt submission, leaderboards, profile rank badge, types 5–8, bulk approval, AI-assisted grading, email notifications.

## Definition of Done
Migration applied; both functions deployed and admin-gated; Sources tab exposes Extract/Draft buttons that successfully create draft challenges from a real PDF and a topic prompt; Challenges tab shows Origin column/filter, AI badge, generation_id pre-filter, edit mode; AI Log tab renders rows with token counts and outcome badges; soft 20/hr cap blocks excessive calls; approved drafts visible to public query, drafts/rejected not.

