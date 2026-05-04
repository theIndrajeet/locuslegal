## Goal
Promote the demo at `/opportunities-preview` into the real **Opportunities Board v2**: production page, three new typed tables (CFPs, Moots, Competitions), admin posting tools per stream, and email notifications. The existing `vacancies` table (Internships + Jobs) is kept as-is.

## Scope

### 1. Database (migration)
Three new tables, each modelled on `vacancies` (status enum, `posted_at`, `expires_at`, `notified_at`, `created_by`, RLS, validation trigger, lifecycle):

- **`cfps`** — `publication_name`, `publication_type` (`journal` | `blog` | `magazine` | `book`), `theme`, `description`, `submission_deadline`, `word_limit_min/max`, `co_authorship_allowed` (bool), `submission_fee` (text — "Free" / "₹500"), `peer_reviewed` (bool), `eligibility`, `submission_url`, `contact_email`, `source_credit`, status, `notified_at`
- **`moots`** — `competition_name`, `organiser`, `edition`, `area_of_law`, `mode` (`offline`/`online`/`hybrid`), `event_start_date`, `event_end_date`, `registration_deadline`, `venue`, `prize_pool`, `eligibility`, `description`, `registration_url`, `source_credit`, status, `notified_at`
- **`competitions`** — `title`, `category` (essay / quiz / debate / negotiation / ADR / hackathon / fellowship / scholarship / other), `organiser`, `deadline`, `event_date`, `mode`, `prize_or_stipend`, `fee`, `eligibility`, `description`, `application_url`, `source_credit`, status, `notified_at`

**Lifecycle:** Single SECURITY DEFINER `opportunities_lifecycle_tick()` archives expired and hard-deletes archived rows older than 30 days across all 3 tables. Cron job nightly.

**RLS pattern (mirrors vacancies):**
- Public: read live + recently archived
- Admin: full read/write (`is_admin(auth.uid())`)
- Validation trigger per table (deadline > posted_at, URLs/emails sanitised)

**Note:** memory mentions tables MUST use `.maybeSingle()` on the client — already standard.

### 2. Edge functions (3 new + 3 templates)
- `send-cfp-digest` — daily 02:30 UTC (08:00 IST). Aggregates CFPs posted in last 24h. Skips if zero.
- `send-moot-digest` — daily 02:31 UTC.
- `send-competition-digest` — daily 02:32 UTC.

Shared template factory `<OpportunityDigest>` in `supabase/functions/_shared/transactional-email-templates/` — neobrutalist card list, per-stream accent color (brand-only: yellow filled / yellow outlined / yellow tinted, mirroring the demo).

Recipient filter: opted-in users (existing per-stream unsub via `email_stream_unsubscribes`), exclude `@locus.internal` and pace-setters (existing helpers).

Internships/Jobs keep existing instant `send-vacancy-instant` — no change.

### 3. Routing + public page
- Replace `src/pages/OpportunitiesPreview.tsx` content with the production page wired to live data.
- New route `/opportunities` (lazy). Keep `/vacancies` as a 301 redirect to `/opportunities` (preserves SEO).
- Retire `/opportunities-preview` (delete file once production page lives).
- Navbar + mobile dock label changes from **Vacancies** → **Opportunities**.

Public page reuses the demo's two-tier nav (Career / Academic / Contests + sub-chips), card layout, and DetailDialog. Data fetched in parallel from 3 tables + vacancies, merged client-side, sorted by `posted_at DESC`.

### 4. Admin (`/admin/opportunities`)
- New admin page with 4 tabs: Vacancies (existing), CFPs, Moots, Competitions.
- Each tab gets:
  - List view (live / archived) with edit/delete
  - Manual create dialog (form per schema)
  - **AI paste-extract**: textarea → `google/gemini-2.5-flash` with per-stream JSON schema → review → save (mirrors existing vacancy paste-extract)
- `AdminDashboard` gains 3 new stat tiles (CFPs live / Moots live / Competitions live).

### 5. Cross-cutting
- Universal Search (Cmd+K) gains 3 new sources for live CFPs / Moots / Competitions.
- TypeScript types regenerate automatically post-migration.
- Memory: replace `mem://features/vacancy-board` with `mem://features/opportunities-board`.

## Out of scope (explicit)
- Per-user save/bookmark
- One-click apply for CFPs/moots
- Public submission forms
- Push notifications
- Editing of `auth.users`/`storage`/etc. reserved schemas

## Implementation order
1. Migration (3 tables + enums + RLS + validation triggers + lifecycle fn + cron)
2. Edge functions + shared digest template + nightly cron schedules
3. Production page + routing + redirect
4. Admin tabs + paste-extract per stream
5. Universal search integration
6. Mobile dock + navbar label swap
7. Memory update + delete demo file

## Technical notes
- Cron: `30 2 * * *`, `31 2 * * *`, `32 2 * * *` UTC for digests; `0 3 * * *` for lifecycle tick
- Paste-extract uses `LOVABLE_API_KEY` (already set), zod-validated per stream schema
- Email template factory accepts `{ stream, items[], unsubUrl }` and renders neobrutalist HTML
- All client queries use `.maybeSingle()` where applicable
- No changes to `auth`, `storage`, `realtime`, `vault`, or `supabase_functions` schemas
