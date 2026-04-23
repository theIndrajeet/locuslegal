# The Bar — Foundation (Prompt 1)

Building the schema, scoring engine, and admin CRUD for The Bar. No AI generation, no student UI, no leaderboards yet — those are prompts 2/3/4.

## What ships

**Database (one migration):** 7 enums, 6 tables (`bar_sources`, `bar_challenges`, `bar_attempts`, `bar_user_stats`, `bar_user_stats_by_area`, `bar_daily_attempts`), 4 triggers, 1 storage bucket (`bar-sources`, private, 50MB, PDF-only), full RLS per spec.

**Scoring engine (pure, tested):** `src/lib/bar/scoring.ts` with `computeBasePoints`, `computeDesignation`, `computeNewStreak`, `gradeMcq`, `gradeIssueSpotter`, `gradeSpeedRound`, `gradeJurisdiction`, `gradeAttempt` dispatcher. Zero DB calls. 20+ Vitest cases in `scoring.test.ts`.

**Admin UI at `/admin/bar`:** admin-gated tabbed page with Sources, Challenges, Stats tabs. Replaces the existing "Coming Soon" `/the-bar` placeholder behavior only by adding a new admin route — `/the-bar` stays as-is for students until prompt 3.

## Schema details

**Enums:** `bar_question_type` (8 values, only first 4 wired), `bar_difficulty`, `bar_area_of_law` (17 values), `bar_challenge_status`, `bar_source_type`, `bar_source_license`, `bar_designation`.

**Tables:** All columns/constraints/indexes per PRD. `bar_attempts` has `UNIQUE(user_id, challenge_id)`. `bar_daily_attempts` has `UNIQUE(user_id, attempt_date)`. `bar_challenges.points_base` constrained 1–100. `bar_sources` uses CHECK constraints for the source_type → field requirements (these are immutable, so CHECK is safe here, not a trigger).

**Triggers:**

- `set_updated_at()` reusable function + triggers on `bar_challenges` and stats tables.
- `bar_attempts_before_insert`: enforces daily cap (≥20 → raise `daily_cap_exceeded`) and verifies the challenge is `approved`.
- `bar_attempts_after_insert`: upserts `bar_user_stats`, `bar_user_stats_by_area`, `bar_daily_attempts`. Recomputes designation inline; if computed tier is `silk`, runs the top-50 check (`SELECT count(*) FROM bar_user_stats WHERE total_points > NEW.total_points`) and caps at `senior_partner` if outside top 50.
- `handle_new_user_bar_stats`: AFTER INSERT on `profiles` → creates `bar_user_stats` row. Also backfill existing profiles in the migration.

**RPC:** `is_admin(uid uuid)` — thin wrapper over existing `has_role(uid, 'admin')` for clarity in policies.

## RLS (exactly per spec)

- `bar_sources`: admin-only on all ops.
- `bar_challenges`: SELECT allows `is_admin(auth.uid()) OR status='approved'`; insert/update/delete admin-only.
- `bar_attempts`: SELECT own + admin; INSERT authenticated WITH CHECK `auth.uid()=user_id` (challenge-approved + daily cap enforced by trigger); no UPDATE; admin DELETE.
- `bar_user_stats`, `bar_user_stats_by_area`: public SELECT, no user writes.
- `bar_daily_attempts`: SELECT own + admin, no user writes.
- Storage `bar-sources`: admin-only via `is_admin(auth.uid())` on `storage.objects`.

## Scoring engine (`src/lib/bar/`)

- `**types.ts`:** TS types + Zod schemas for each payload + answer pair. Reserved types export schemas that always reject.
- `**constants.ts`:** `BASE_POINTS_BY_TYPE`, `DIFFICULTY_MULTIPLIER`, `RANK_THRESHOLDS` (array of `{designation, minPoints, minAccuracy}`), `DAILY_CAP=20`, `AREA_OF_LAW_LABELS`, `QUESTION_TYPE_LABELS`.
- `**scoring.ts`:** all pure functions per PRD. `gradeAttempt` validates with Zod, throws `GradingError` on bad shapes. Speed round: `floor((correct/total)*pointsBase)`, `is_correct = correct/total ≥ 0.7`. Issue spotter: exact set match only.
- `**scoring.test.ts`:** ≥20 Vitest cases covering each function, threshold edges, accuracy floor, invalid payloads.

## Admin UI

**Route:** `/admin/bar` added to `<Layout/>` group in `src/App.tsx`. On mount, queries `user_roles` for `auth.uid()`. Non-admin → renders an "Access denied" card with Back-to-Home (no redirect, so the URL stays inspectable).

**Navbar:** add a conditional `Admin` NavLink visible only when role check resolves to admin (reusing the same role query, cached via React Query).

**Page (`AdminBar.tsx`):** shadcn `Tabs` — Sources / Challenges / Stats. Top-of-file README comment: *"To grant admin: INSERT into user_roles (user_id, role) VALUES ('*&nbsp;*', 'admin'). Do not hardcode."*

**Sources tab (`SourceLibrary.tsx`):**

- Table of sources + Upload PDF / Add Topic Prompt buttons (Dialogs).
- PDF upload: client-side validation (PDF + ≤50MB), uploads to `bar-sources/{source_id}/{filename}`, then inserts `bar_sources` row.
- Topic prompt: title + prompt textarea + license, no file.
- View dialog generates 60s signed URL for PDF download. Delete via AlertDialog.

**Challenges tab (`ChallengesTable.tsx` + `ChallengeForm.tsx`):**

- Table with status/type/area/difficulty filters.
- Create button opens `Sheet` with `react-hook-form` + Zod resolvers using the shared payload schemas.
- Type select shows only the 4 v1 types (others hidden).
- Dynamic payload sub-form per type (option list with add/remove for MCQ/Jurisdiction; checkbox-multi for Issue Spotter; sub-question repeater + time limit for Speed Round).
- On submit: compute `points_base` via `computeBasePoints`, insert with `status='draft'`. Saved drafts get Submit-for-Review / Approve / Reject (with reason via AlertDialog) / Archive / Edit actions per current status.

**Stats tab (`BarStats.tsx`):** four count cards (challenges by status, total attempts, distinct active users, pending review count). Plain numbers, no charts.

## File map

New:

- `supabase/migrations/<timestamp>_bar_foundation.sql`
- `src/lib/bar/types.ts`
- `src/lib/bar/constants.ts`
- `src/lib/bar/scoring.ts`
- `src/lib/bar/scoring.test.ts`
- `src/pages/AdminBar.tsx`
- `src/components/admin-bar/SourceLibrary.tsx`
- `src/components/admin-bar/ChallengesTable.tsx`
- `src/components/admin-bar/ChallengeForm.tsx`
- `src/components/admin-bar/BarStats.tsx`

Modified:

- `src/App.tsx` (route)
- `src/components/Navbar.tsx` (admin link)

## Out of scope (later prompts)

AI extraction, student-facing question UI, leaderboards, profile rank badge, types 5–8, the existing `/the-bar` placeholder page (untouched).

## Definition of Done

Schema + triggers + RLS deployed; storage bucket live; ≥20 scoring tests green; admin can upload a source, create + approve all 4 question types; non-admins blocked from `/admin/bar` and from reading non-approved rows; an authenticated user `INSERT` into `bar_attempts` for an approved challenge succeeds and updates stats; the 21st attempt in a UTC day is rejected; Stats tab shows real counts.  
  
Plan looks good. Two adjustments before you run:

1. Fix the silk top-50 check:

   - Query only against users who ALREADY meet silk's point threshold (50,000 points), not the entire user base. A silk seat is "top 50 AMONG those who've qualified on points".

   - Add tiebreaker: if multiple users are tied at the boundary, rank by earliest `last_attempt_at` first (stable, deterministic).

   - Only run this check in the trigger when the user is newly crossing into silk eligibility — skip it on every attempt if they're still below 50k points OR already marked silk and their stats haven't changed rank tier. Save the wasted query.

2. Verify two things in your output that you didn't explicitly mention:

   - The reserved Zod schemas (for document_review, brief_builder, ethics, client_counseling) MUST reject all submissions. Confirm this in the code.

   - The updated_at trigger fires on BOTH bar_user_stats AND bar_user_stats_by_area, not just one.

Everything else looks right. Proceed.