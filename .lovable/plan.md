## Goal

Send one branded "Start your journey on Locus" email to all 30 unique addresses (16 signed-up users + 14 waitlist-only emails), highlighting Directory apply, CV Analyser, The Bar, and Vacancy Board.

## Approach

Reuse the existing `/admin/updates` flow — same composer, same `updates-broadcast` template, same queue, same unsubscribe handling. Only one piece needs to change: the dispatcher currently pulls recipients from `auth.users` only. We'll widen it to also include waitlist emails.

## Changes

### 1. Widen the recipient pool in the dispatcher

Edit `supabase/functions/dispatch-updates-broadcast/index.ts`:

- After paginating `auth.admin.listUsers`, also `SELECT DISTINCT email FROM waitlist_submissions`.
- Merge into the same `recipients` array, then dedupe (existing `Array.from(new Set(...))` already handles this).
- Suppression check + queue enqueue stay exactly as they are — waitlist emails get filtered against `suppressed_emails` and get the same per-recipient unsubscribe link automatically.
- Test mode (`testEmail`) is unaffected.

That's it on the backend. No schema changes, no new tables, no new edge function.

### 2. Surface the wider count in the admin UI (small polish)

In `src/pages/AdminUpdates.tsx`, update the recipient hint near the "Send to all users" button to read something like "Sends to all signed-up users + waitlist emails (deduped, suppressed addresses skipped)" so you know what you're firing.

### 3. Draft the email copy

I'll pre-fill a draft broadcast row (or just hand you the markdown to paste) with this structure — copy is yours to tweak in the composer before hitting send:

- **Subject:** Start your journey on Locus
- **Preheader:** Apply to firms in one click, sharpen your CV, practice The Bar, and grab live vacancies.
- **Body (markdown):**
  - Short opening: "Locus has grown up since you signed up. Here's what's live for you right now."
  - Four tight sections, each one line + a soft sub-line:
    - **Directory** — Browse Indian law firms and startups on the India map, and apply to any of them in one click straight from their profile.
    - **CV Analyser** — Upload your CV, get feedback tuned to how Indian legal recruiting actually works.
    - **The Bar** — Practice realistic legal challenges (MCQs, speed rounds, briefs, client counseling) and climb a global leaderboard.
    - **Vacancy Board** — Live, curated internship and job openings, refreshed regularly.
  - Closing nudge with a single primary CTA.
- **CTA label:** Start your journey
- **CTA URL:** `https://locus.legal/app` (signed-in users land in the dashboard; waitlist-only emails land on the marketing site → sign-up)

### 4. You hit send

Open `/admin/updates`, review the draft, optionally do a `testEmail` to yourself first, then "Send to all". The queue handles delivery, retries, and rate limits — no further action needed.

## What this does NOT touch

- No changes to `update_broadcasts` schema.
- No changes to the `updates-broadcast` React Email template.
- No changes to `send-transactional-email`, the queue, or unsubscribe flow.
- No new RLS policies, no new tables.

## Caveats worth knowing

- **Waitlist emails never explicitly opted into product updates.** This is a one-time relevant product announcement to people who voluntarily gave you their email expecting Locus news, so it's defensible as transactional/expected. The unsubscribe footer is auto-appended by the system, so anyone uninterested can opt out in one click.
- The email body background stays white (system requirement) even though the app is dark-themed — that's already how the template works.
- After sending, the broadcast row's `recipient_count` will reflect ~30 (minus any suppressed), and the email log at `/admin/emails` will show per-recipient status.
