# Vacancy drafter — recognise internship vs job

Right now the AI drafter extracts firm/role/email/etc., but it never classifies the posting as an **internship** vs a **full-time job**. So both bucket together in admin and on the public board. We'll add a first-class `opportunity_type` field through the whole stack.

## What changes

### 1. Database
Add a typed column on `vacancies`:
- New enum `vacancy_opportunity_type` with values `internship` and `job`.
- New column `opportunity_type vacancy_opportunity_type NOT NULL DEFAULT 'internship'`.
- Backfill existing rows with a heuristic: rows whose `role` ILIKE any of `%intern%`, `%clerk%`, `%trainee%`, `%assessment%` → `internship`; everything else → `job`. (Locus is internship-heavy, so the default stays `internship`.)

### 2. AI extraction (`supabase/functions/extract-vacancy/index.ts`)
- Extend the system prompt with explicit classification rules:
  - `internship` = time-bound, often unpaid/stipended, language like "intern", "internship", "clerkship", "summer position", "X-week assessment", "trainee", "law student", "currently in 3rd/4th/5th year".
  - `job` = open-ended employment: "associate", "lawyer", "counsel", "lateral hire", "full-time", "PQE", "experience required", a CTC instead of stipend.
  - When ambiguous, prefer `internship` (curator's domain) but flag in `description` if needed.
- Add `opportunity_type` to the `extract_vacancy` tool schema as a required enum (`"internship" | "job"`).
- Return it in the JSON response (default to `"internship"` if the model omits it, just to be safe).

### 3. Admin dialog (`src/components/vacancies/AdminVacancyDialog.tsx`)
- Add `opportunity_type: "internship" | "job"` to `FormState` (default `"internship"`).
- Hydrate it from the AI response and from `initial` in edit mode.
- Add a compact toggle (segmented control / two buttons) at the top of the review form labelled **Type *** with **Internship** and **Job**. Visible in both create and edit flows.
- Include `opportunity_type` in both `insert` and `update` payloads.
- After AI extraction, surface a tiny chip under the toast (e.g. `Detected: Internship`) so the admin notices and can correct.

### 4. Public + admin surfaces
- `src/lib/vacancies.ts`: extend the `Vacancy` interface with `opportunity_type`.
- `src/components/vacancies/VacancyCard.tsx`: render a small neobrutalist chip ("Internship" yellow / "Job" white-on-black border) next to the role.
- `src/pages/AdminVacancies.tsx`: show the type badge in the row, and add a filter pill (All / Internships / Jobs) above the list.
- `src/pages/Vacancies.tsx`: add the same filter pill so students can narrow the board.
- `VacancyTeaserStrip.tsx`: include the type chip inline.

### 5. Notification + email templates
- `supabase/functions/_shared/transactional-email-templates/new-vacancy.tsx`: include the type ("New internship at …" vs "New job at …") in subject + heading. (One-line tweak using the new field.)

## Out of scope
- Splitting the public page into two tabs (we keep one board with a filter pill — fewer clicks, matches current UX).
- Backdating notifications for re-classified rows.

## Technical notes
- Migration uses a `DO` block + `CREATE TYPE IF NOT EXISTS` pattern; backfill is a single `UPDATE … CASE` statement before flipping the column to `NOT NULL`.
- AI tool schema requires `opportunity_type` so Gemini can't silently drop it; server still defends with a fallback.
- No RLS changes needed — existing policies cover the new column.
