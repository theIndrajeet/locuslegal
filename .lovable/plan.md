# Interactive Beta Tester Page

Turn the PDF checklist into a live, shareable, fillable page at `/beta`. Testers open one link, walk the 7-stage journey, mark each task Pass / Fail / Blocked, drop bug notes + screenshots, and submit. Every response lands in your database, viewable in a private admin dashboard.

## What testers will see

A single dedicated route — **`/beta`** — styled in the Locus neobrutalist look (black borders, yellow accents, Sora headings, Inter body, zero emojis).

```text
┌──────────────────────────────────────────────┐
│  LOCUS · CLOSED BETA                         │
│  Tester checklist · ~30 min                  │
│  [Progress bar: 7 of 24 tasks]               │
├──────────────────────────────────────────────┤
│  STAGE 1 — FIRST IMPRESSION  (collapsible)   │
│   ▸ Task 1.1  Land on locus.legal …          │
│       ◉ Pass  ◯ Fail  ◯ Blocked              │
│       [bug notes textarea]                   │
│       [+ attach screenshot]                  │
│   ▸ Task 1.2  …                              │
├──────────────────────────────────────────────┤
│  STAGE 2 — SIGN UP & PROFILE                 │
│  …                                           │
├──────────────────────────────────────────────┤
│  Your name   [______]  Email (optional) [__] │
│  Overall vibe (1–10) [slider]                │
│  Anything else?  [textarea]                  │
│  [ SUBMIT FEEDBACK ]                         │
└──────────────────────────────────────────────┘
```

Key UX behaviours:
- **Auto-save draft to localStorage** on every change — testers can close the tab and resume.
- **Sticky progress bar** showing `X of 24` complete.
- **Collapsible stages** so the page isn't a wall of text.
- **Screenshot upload** per task (optional, private bucket).
- **One final submit** — locks the response, shows a thank-you screen.
- **No login required** — anyone with the link can fill it.

## How sharing works

- Page lives at `/beta` and is **not linked from navbar, footer, or sitemap** — discoverable only via the URL you share.
- `robots.txt` updated to exclude `/beta` so it isn't indexed.
- Light gate: a `?code=LOCUS-CB-2026` query check. Missing/wrong code shows a neutral "link looks broken" screen. Stops crawlers, zero friction for your 6 testers.

## What you'll see (admin only)

A new admin route **`/admin/beta`** — protected by your existing `useAdminRole` hook (only `heyjeetttt@gmail.com`):
- Table of every submission: tester name, timestamp, overall score, % pass.
- Click a row to expand → full per-task breakdown with status, bug notes, and inline screenshot thumbnails.
- **Export to CSV** button for offline triage.
- Headline counters at top: total submissions, total bugs reported, most-failed task.

## Technical details

**Routes**
- `src/pages/BetaChecklist.tsx` — the form (lazy-loaded in `App.tsx`, registered in `lib/prefetch.ts`).
- `src/pages/AdminBeta.tsx` — admin response viewer.

**Database (one new table via migration)**
```sql
create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  tester_name text not null,
  tester_email text,
  overall_score int,
  general_notes text,
  responses jsonb not null,    -- { "1.1": { status, notes, screenshot_path }, ... }
  user_agent text,
  created_at timestamptz not null default now()
);
```

RLS:
- `INSERT` — `anon` + `authenticated` (link works without login).
- `SELECT` / `DELETE` — admin only via `is_admin(auth.uid())`.

**Storage**
- New private bucket `beta-screenshots`. Anon `INSERT` allowed; `SELECT` admin-only. Files at `{submissionId}/{taskId}-{filename}`.

**Content source of truth**
- `src/content/beta-checklist.ts` — the same 24 tasks across 7 stages from the PDF, exported as a typed array. The page renders from this so future edits are one-file changes.

## Out of scope (easy to add later)
- Per-tester unique invite codes.
- Email notifications on new submission.
- Edit-after-submit.