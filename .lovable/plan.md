## Locus Vacancy Board

A curated, scarcity-driven internship board. You (admin) post 2–5 live vacancies via paste-and-extract; each one auto-expires after a fixed window; students apply through the existing Brief Builder.

---

### 1. Database

New table `vacancies`:

| field | type | notes |
|---|---|---|
| id | uuid pk | |
| firm_name | text | required |
| role | text | required |
| location | text | nullable (city) |
| application_email | text | required, validated regex; **rejected if empty** |
| eligibility | text | one-liner, nullable |
| stipend | text | nullable, free-form ("Unpaid", "₹15k/mo") |
| description | text | freeform details block (markdown-lite) |
| posted_at | timestamptz | default now() |
| expires_at | timestamptz | required, default `posted_at + 5 days` |
| status | enum: `live` \| `archived` \| `deleted` | default `live` |
| created_by | uuid | admin's user_id |
| source_credit | text | nullable (e.g. "via @source") |

**RLS**
- Public SELECT where `status = 'live' AND expires_at > now()` and where `status = 'archived' AND expires_at > now() - 30d` (archive view).
- Admin full CRUD via `is_admin(auth.uid())`.

**Validation trigger** (not CHECK constraint): on INSERT/UPDATE, reject if `application_email` is null/empty or doesn't match an email regex. Returns clear error so the admin UI can warn.

**Auto-lifecycle** via `pg_cron` (hourly):
- Move `live` → `archived` when `expires_at < now()`.
- Hard-DELETE rows where `status = 'archived' AND expires_at < now() - interval '30 days'`.

**Indexes**: `(status, expires_at desc)`, `(expires_at)`.

---

### 2. Admin: paste-and-extract flow

New tab in `/admin/bar` style — actually a new admin route **`/admin/vacancies`** (linked from Profile menu like Admin Bar / Admin Beta).

UI:
- Top section: list of live + archived vacancies (table). Columns: firm, role, posted, expires, status, actions (edit / archive now / delete).
- Big primary CTA: **"Add vacancy"** → opens dialog.

Dialog (mirrors `AiExtractDialog` pattern):
1. Step 1 — Paste raw text (textarea). Button **"Extract with AI"**.
2. Edge function `extract-vacancy` calls Lovable AI (`google/gemini-3-flash-preview`) with tool-calling to return structured fields.
3. Step 2 — Pre-filled form. Admin reviews, edits, picks expiry (default +5 days, max +14).
4. **Hard validation**: if `application_email` is missing or invalid → block submit with toast "Vacancy must have an application email — direct-link postings are not accepted." (matches your rule).
5. Save → row inserted, toast confirms, list refreshes.

---

### 3. Public `/vacancies` page

Layout:
- Hero strip: "Live Vacancies" + countdown helper text ("3 firms hiring this week. Closes when the deadline expires.").
- Grid of vacancy cards (2 cols on desktop, 1 on mobile).
- Section divider, then **"Recently closed"** (archived, last 30 days) shown greyed-out with a `Closed` badge — non-interactive (no Apply button).

**Card** (neobrutalist, matches existing Locus aesthetic):
- Firm name (Sora bold) + role
- Location · Stipend · Eligibility one-liner
- **Days-left pill**: yellow when ≥3 days, **grey + warning icon when ≤2 days** ("Closes in 2 days").
- Truncated description (3 lines), "Read more" expands.
- Primary button: **"Draft application"** → opens existing Brief Builder + DraftEmailDialog with vacancy's firm/role/email pre-filled.
- Secondary: copy email icon.

Empty state: "No live vacancies right now. Check back tomorrow — new postings curated daily."

---

### 4. Directory teaser

On `/directory`, between the page header and filter bar, render a compact **"Live Vacancies (N)"** card:
- Horizontally swipeable mini-cards (one per live vacancy), each showing firm + role + days-left.
- Tap a mini-card → navigates to `/vacancies#<id>` (anchors scroll to that card).
- "View all" link in top-right of the strip.
- If 0 live vacancies → strip hidden entirely (no empty space).

Filter bar stays as-is; the strip sits *above* it, so we don't shrink filters.

---

### 5. Apply flow integration

Reuse existing `DraftEmailDialog`. Add a new entry-point prop `vacancyContext?: { firm, role, email, eligibility, description }` so the Brief Builder:
- Pre-fills firm + role + recipient email.
- Passes vacancy description to the email-draft edge function as extra grounding ("This is the live posting: …") so the AI can reference specific asks ("you mentioned needing IP-litigation interest").

No changes to tracker logging — stays manual (matches "Manual log" decision baseline; you said "reuse current flow").

---

### 6. Discoverability

- **Top nav**: add "Vacancies" link (between Directory and Playbook). Pulse-dot indicator if N ≥ 1 live.
- **Mobile bottom dock** (`MobileBottomDock`): add Vacancies icon (Lucide `Briefcase`).
- **Universal search** (Cmd+K): index live vacancies as a new result type ("Vacancy: <Firm> — <Role>").
- **AppHome dashboard**: small "Live Vacancies (N)" tile in QuickActionsFooter or PipelinePane.

---

### 7. Out of scope (explicitly)

- No application count / "X students applied" — keeps cold-email model intact.
- No saved-vacancy / favourite feature (yet).
- No vacancy-specific notifications (yet — defer to v2).
- Archived vacancies are read-only; no Apply button.

---

### Technical details

**Files to create**
- `supabase/migrations/*` — new table, enum, RLS, validation trigger, indexes.
- `supabase/functions/extract-vacancy/index.ts` — Lovable AI tool-calling extraction.
- Cron setup: insert via the supabase insert tool (per cron rules).
- `src/pages/Vacancies.tsx`
- `src/pages/AdminVacancies.tsx`
- `src/components/vacancies/VacancyCard.tsx`
- `src/components/vacancies/VacancyDialog.tsx` (full detail)
- `src/components/vacancies/AdminVacancyDialog.tsx` (paste & extract + form)
- `src/components/vacancies/VacancyTeaserStrip.tsx` (Directory swipeable strip)

**Files to edit**
- `src/App.tsx` — add `/vacancies` and `/admin/vacancies` routes (lazy).
- `src/lib/prefetch.ts` — register imports.
- `src/components/Navbar.tsx` — add Vacancies link + pulse dot.
- `src/components/MobileBottomDock.tsx` — add icon.
- `src/components/ProfileMenu.tsx` — Admin Vacancies link for admins.
- `src/pages/Directory.tsx` — render `VacancyTeaserStrip`.
- `src/components/apply/DraftEmailDialog.tsx` — accept optional `vacancyContext` prop.
- `supabase/functions/draft-application-email/index.ts` — accept vacancy context in payload.
- `src/components/search/searchEngine.ts` — index vacancies.
- `mem://features/vacancy-board` — new memory file + index update.

**Empty / edge cases handled**
- 0 live vacancies → teaser strip hidden, /vacancies shows empty state.
- Vacancy expiring during a user's session → next refresh moves it to archived; no broken Apply button (we re-check `status` server-side).
- Admin tries to save without application email → blocked at trigger + form.
- Cron failure → archived view query also filters `expires_at > now()` so stale `live` rows still display correctly until the next cron tick.

**Estimated scope**: 1 migration, 1 edge function, 2 pages, 4 components, ~7 file edits. Roughly a 1-day build.
