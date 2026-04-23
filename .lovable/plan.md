

# AI Topic Suggester for Source Library

Add a third button in the admin Source Library — **"AI Suggest Topics"** — next to "Upload PDF" and "Add Topic Prompt". It opens a dialog with two modes:

1. **Surprise me** — AI proposes N tough/exam-worthy Indian-law topics across selected areas/difficulty.
2. **Expand my seed** — Admin types a rough seed (e.g. *"Section 69A blocking orders"*); AI researches and writes a full topic prompt around it.

Each AI-returned topic becomes a row in `bar_sources` with `source_type = 'topic_prompt'`, ready for the existing "Draft" flow to turn into challenges.

## New edge function: `suggest-topics`

Path: `supabase/functions/suggest-topics/index.ts`

- Admin-only (same auth + role check pattern as `draft-question-from-prompt`).
- Logs to `bar_ai_generations` with a new `generation_type = 'topic_suggest'`.
- Reuses the 20-req/hour rate limit logic (already enforced client-side; server logs anyway).
- Body schema:
  ```ts
  {
    mode: "surprise" | "expand",
    count: number (1-10),                 // surprise mode
    seed?: string (max 500),              // expand mode
    areas?: AreaOfLaw[] (optional filter),
    difficulty_hint?: "easy"|"medium"|"hard",
    license: "public_domain"|"licensed"|"fair_use_claim"|"user_submitted"|"other"
  }
  ```
- Calls `google/gemini-3-flash-preview` via Lovable AI Gateway with a strict JSON tool-call schema:
  ```
  { "topics": [
      { "title": "...", "description": "...", "topic_prompt": "...", "suggested_area": "...", "suggested_difficulty": "..." }
  ] }
  ```
- System prompt: senior Indian-law academic; must ground topics in real statutes/cases; refuse if uncertain (returns `{refused: true, reason}`).
- For each valid topic, inserts a row into `bar_sources` (`source_type='topic_prompt'`, `uploaded_by=admin uid`, `license` from request).
- Returns `{ generation_id, sources_created, source_ids }`.

## New dialog: `AiSuggestTopicsDialog.tsx`

Path: `src/components/admin-bar/AiSuggestTopicsDialog.tsx`

UI:
- Tabs at top: **Surprise me** / **Expand a seed**.
- Surprise me: count slider (1–10, default 5), optional Area-of-law multi-select (or "Any"), optional difficulty (Any/easy/medium/hard).
- Expand a seed: large `Textarea` (max 500 chars) for the seed, optional area + difficulty.
- Shared: License `Select` (defaults to `other`).
- Footer: Cancel / **Generate** button with `Sparkles` icon and "Working… 10–45s" toast.
- On success: toast `Created N topic source(s)` with action button **Review in Sources** → closes dialog and triggers `onCreated()` to reload the table; the new rows appear at top, ready for the existing **Draft** action.

Reuses the same `checkRateLimit()` pattern as `AiDraftDialog`.

## Wire-up in `SourceLibrary.tsx`

- Add a third button to the header row: `<Button variant="outline"><Sparkles/> AI Suggest Topics</Button>` → opens the new dialog.
- Pass `onCreated={load}` so the table refreshes.
- No changes to the table, view dialog, delete flow, or the existing Draft flow — newly created topic rows already get the **Draft** action.

## Database

No schema changes needed. `bar_ai_generations.generation_type` already accepts arbitrary string values (or, if it's an enum, we add `'topic_suggest'` via migration — verifying during implementation).

## Files

**New**
- `supabase/functions/suggest-topics/index.ts`
- `src/components/admin-bar/AiSuggestTopicsDialog.tsx`

**Modified**
- `src/components/admin-bar/SourceLibrary.tsx` — add button + dialog mount.
- `supabase/config.toml` — register new function (verify_jwt default).

**Possibly modified**
- One small migration if `generation_type` is an enum that needs `'topic_suggest'` added.

## Out of scope
No changes to challenge drafting, scoring, RLS on `bar_sources` (admin-only writes already enforced), or student-facing pages. Topic suggestion does NOT auto-create challenges — admin still reviews each topic and clicks Draft to turn it into a question.

## Definition of Done
Admin opens `/admin/bar` → Sources tab → clicks **AI Suggest Topics** → picks Surprise me + count 5 → gets 5 new topic_prompt rows in the table within ~30s, each with a populated description and topic_prompt body. Each new row has the **Draft** button ready. Expand-seed mode produces a single richer topic_prompt row from the seed text. AI refusals show a friendly error toast; rate-limited and credit-exhausted cases surface clear messages. Every call is logged in `bar_ai_generations`.

