# Fix opportunity dates + add link strip to modal top

You raised two real issues. I confirmed both against the database.

## What actually happened with the NLSIU CFPs

I queried `cfps`. All 8 NLSIU rows were inserted in a single batch at the same timestamp. The deadlines stored vs what the source page actually says:

| CFP | Source page says | Stored as | Verdict |
|---|---|---|---|
| NLSJ general | Rolling (no deadline) | 2026-12-31 | Hallucinated |
| IJCLP Vol 14 | 30 May 2026 | 2026-05-30 | Correct |
| JLPP Vol 9(2) | 31 Jan 2026 | 2026-12-31 | Wrong + past |
| JLPP Vol 10(1) Special | 31 Jan 2026 | 2026-12-31 | Wrong + past |
| SLR general | Rolling | 2026-12-31 | Hallucinated |
| SLR Vol 22(2) Special | 15 Apr 2026 | 2026-12-31 | Wrong + past |
| IJLT Vol 22 | 15 May 2026 | 2026-05-15 | Correct |
| IJIEL Vol 17(2) | 8 May 2026 | 2026-05-08 | Correct |

So 5 of 8 are wrong. Three are real past-dated CFPs (Jan 31, Jan 31, Apr 15) that should never have been on the board. Two are rolling-deadline journals that don't really have a single date and shouldn't be filed under a fake Dec 31 expiry.

Today is 4 May 2026. Per your standing rule (no expired opportunities), only the 3 with deadlines after today (IJCLP 30 May, IJLT 15 May, IJIEL 8 May) should be live.

## Plan

### 1. Clean the bad NLSIU rows
Delete the 5 wrong/past rows from `cfps`:
- NLSJ general (rolling)
- JLPP Vol 9(2) (past)
- JLPP Vol 10(1) Special (past)
- SLR general (rolling)
- SLR Vol 22(2) Special (past)

Keep the 3 correctly-dated future ones (IJCLP, IJLT, IJIEL).

### 2. Stop date hallucinations on extract + insert

Two layers of defence:

**A. Tighten the AI prompt in `extract-opportunity`:**
- For each stream's deadline field, require the date to come verbatim from the text. If the post says "rolling", "year-round", "ongoing", or has no explicit date, the model must return `null` (not invent one).
- Make `submission_deadline` / `registration_deadline` / `deadline` allow `null` in the JSON tool schema.
- Tell the model: never use end-of-year (Dec 31) as a fallback; never approximate; if multiple dates appear, pick the one literally labelled deadline/last date for submission.

**B. Hard validation in `PasteExtractDialog.submit()`:**
- If the deadline field is missing or earlier than today, block the insert with a toast: "Deadline is missing or in the past — fix it before publishing."
- This catches anything the AI still gets wrong, before it lands in the DB.

### 3. Add a guideline + submission link strip to the modal top

Right now the yellow band on top of the detail modal only carries the type pill ("CALL FOR PAPERS") and the countdown ("241D LEFT"). I'll add a second mini-row inside that yellow band — directly under the pill/countdown line — with two compact link chips:

- **Guidelines** → `brochure_url` (or whichever URL field carries the brochure / guidelines PDF)
- **Submission** → `submission_url` (CFP) / `registration_url` (moot) / `application_url` (competition)

Behaviour:
- Each chip is a small pill button: yellow background, black border, black text, opens in a new tab, with a `FileText` icon for Guidelines and `ExternalLink` icon for Submission.
- If only one of the two links exists, only that chip renders (no empty placeholder).
- If neither exists, the row collapses entirely so the title moves up — no awkward gap.
- Vacancies (internship/job) are unaffected — they still use the draft-and-track flow you already have.

### 4. Source visibility (carry-over)
The "Source: NLSIU" line at the bottom of the scroll area was being clipped by the gradient fade. I'll add bottom padding inside the scroll container and reduce the fade height so it's fully visible.

## Files touched

- `supabase/functions/extract-opportunity/index.ts` — prompt + schema (allow null deadline, ban Dec-31 fallback)
- `src/components/admin/opportunities/PasteExtractDialog.tsx` — pre-insert deadline validation
- `src/pages/Opportunities.tsx` — yellow-strip link chips + scroll padding fix
- DB migration — delete the 5 bad NLSIU rows

## Out of scope
- No schema changes to `cfps` / `moots` / `competitions`.
- No changes to vacancy draft-and-track flow.
- No bulk re-extraction — you can re-paste the 3 future-dated NLSIU calls individually if you want them with cleaner descriptions.
