## Goal

Make CFP / Moot / Competition extraction reliably capture **submission/registration URL** and **brochure URL**, and fix the broken deadline field in the admin paste-extract dialog.

---

## 1. Database — add `brochure_url` to all three streams

Migration adds a nullable `text` column to `cfps`, `moots`, `competitions`:

```sql
alter table public.cfps          add column if not exists brochure_url text;
alter table public.moots         add column if not exists brochure_url text;
alter table public.competitions  add column if not exists brochure_url text;
```

No RLS changes (existing policies cover all columns).

---

## 2. Extractor edge function (`supabase/functions/extract-opportunity/index.ts`)

**Per-stream prompt updates:**

- CFP: clarify that when a post lists multiple dates (registration, abstract, presentation, final paper), `submission_deadline` MUST be the **abstract submission deadline** (or the headline submission deadline if no abstract stage). Keep ISO end-of-day UTC rule.
- Moot: `registration_deadline` = the registration close, not the event date.
- Competition: `deadline` = the primary application/submission deadline.
- All three: "If ANY URL appears in the text (Google Forms, registration link, application link), put it in `submission_url`/`registration_url`/`application_url` — never null when one is present."
- All three: add `brochure_url` instruction — "Any link to a PDF brochure / 'Click here for Brochure' / drive link to the brochure goes here. Null if absent."

**Tool schemas:** add `brochure_url: { type: ["string", "null"] }` to all three schemas.

**Server-side URL fallback:** after AI returns, if the relevant URL field is null, run a regex over the original `text` (`/https?:\/\/\S+/g`), pick the first non-image URL, and assign it to the URL field. This guarantees a link is captured even when the model misses it.

---

## 3. Paste-extract dialog (`src/components/admin/opportunities/PasteExtractDialog.tsx`)

**Fix the deadline input** — currently `type: "date"` falls through to a plain text box. Change the render to:

```tsx
type={f.type === "number" ? "number" : f.type === "date" ? "datetime-local" : "text"}
```

…and add a helper that converts the AI's ISO string `2026-05-03T23:59:59Z` ↔ the `datetime-local` shape `2026-05-03T23:59` when reading/writing the form value. On submit, convert back to a full ISO string before insert.

**Add `brochure_url` field** to all three FIELDS arrays (label "Brochure URL", type "url"), positioned right after the submission/registration/application URL.

**Reorder** so that the URL fields and deadline appear near the top of the form (above eligibility/description) — they're the most-edited fields.

---

## 4. Public detail dialog (`src/pages/Opportunities.tsx`)

- Add a **"Brochure"** outline button to the sticky CTA footer (next to "Copy link") whenever `item.brochure_url` is set, opening the URL in a new tab.
- No other UI changes; the existing primary "Submit paper" / "Register" / "Apply" button already uses `submission_url` etc.

---

## Files touched

- `supabase/migrations/<new>.sql` — add `brochure_url` columns
- `supabase/functions/extract-opportunity/index.ts` — prompts, schemas, URL fallback
- `src/components/admin/opportunities/PasteExtractDialog.tsx` — deadline picker, brochure field, ISO conversion
- `src/pages/Opportunities.tsx` — brochure button in detail footer

## Out of scope

- No changes to Vacancies (already has its own admin dialog).
- No backfill of existing rows (brochure stays null until re-edited).
- No retroactive AI re-extraction of already-published posts.
