# Email Notification System — Plan

Built on existing infrastructure (`auth-email-hook`, pgmq queues, `email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens`). No vacancy/bar/broadcast emails currently exist — we are adding them now. Excludes: send-transactional-email function rebuild, in-app bell, user-facing preferences UI.

## Decisions locked in

- **Granularity:** No in-app toggle. Everyone is opted in by default. Opt-out happens via per-stream + global "unsubscribe all" links in every email footer.
- **Cadence:** Instant for application-tracker events. Daily 8am IST digest for vacancies and bar challenges.
- **Storage:** Email-only. No `/notifications` bell.
- **Broadcasts:** Admin markdown editor + send-to-segment, using existing `update_broadcasts` table.

## Streams to build (5)

1. **Welcome email** — Instant on signup. Branded intro + 3 CTAs (complete profile, browse vacancies, try The Bar).
2. **Profile completion nudge** — T+48h post-signup if profile <50% complete (no college/CV/subjects). One-shot.
3. **Application tracker** — Instant on `profile_applications.status` change (sent → interviewing/offer/rejected). Plus weekly Sunday recap ("X apps sent, Y awaiting reply").
4. **Vacancy digest** — Daily 8am IST. New `live` vacancies posted in last 24h. Uses `vacancies.notified_at` to avoid re-sending.
5. **Bar challenge digest** — Daily 8am IST. New `approved` challenges in last 24h. Uses `bar_challenges.notified_at`.
6. **Admin broadcasts** — Manual fire from `/admin/broadcasts`. Markdown → HTML, segment picker (all users / has applications / opted-in), uses existing `update_broadcasts` table.

## Architecture

```text
   Trigger (DB trigger / cron / admin click)
              │
              ▼
   build-notification edge fn  ──► reads opt-outs from email_unsubscribe_tokens
              │                     (filters out unsubscribed addresses)
              ▼
   enqueue_email() → pgmq (transactional_emails queue)
              │
              ▼
   process-email-queue (existing cron, every 5s)
              │
              ▼
   Lovable Email API → email_send_log
```

All emails route through the existing pgmq queue — same retry/DLQ/rate-limit safety as auth emails.

## Database changes

1. **Extend `email_unsubscribe_tokens`** — add `stream text` column (NULL = global unsub, otherwise: `welcome | nudges | applications | vacancies | bar | broadcasts`). One row per (email, stream).
2. **New `notification_log` table** — dedupe key per (user_id, stream, entity_id) so we never double-send a vacancy alert. Append-only.
3. **Trigger on `profile_applications`** — fires `enqueue_email` on status change.
4. **Trigger on `auth.users` insert** (via existing `handle_new_user` extension) — enqueues welcome email.
5. **pg_cron jobs**:
   - Daily 08:00 IST (`30 2 * * *` UTC) → `send-vacancy-digest` + `send-bar-digest`
   - Daily 03:00 IST → `send-profile-nudges` (scans for T+48h incomplete profiles)
   - Sunday 09:00 IST → `send-application-recap`

## Edge functions (new)

- `send-welcome-email` (instant, called from signup flow)
- `send-application-status-email` (instant, called from DB trigger via pg_net)
- `send-vacancy-digest` (cron-invoked)
- `send-bar-digest` (cron-invoked)
- `send-profile-nudge` (cron-invoked)
- `send-application-recap` (cron-invoked)
- `send-broadcast` (admin-invoked from `/admin/broadcasts`)
- `handle-email-unsubscribe` (public GET endpoint for footer links — already partially scaffolded; extend to handle stream param)

All share `_shared/email-templates/` (extend existing folder with 6 new templates matching neobrutalist branding: black bg, yellow accents, Sora/Inter, 3px borders).

## Admin UI

New route `/admin/broadcasts`:
- List view: all `update_broadcasts` rows with status/sent_at/recipient_count
- Editor: subject, preheader, markdown body (rendered to HTML server-side), CTA label/url
- Segment picker: All users · Has applications · Opted-in to broadcasts · Beta testers
- "Send test to me" + "Send to segment" buttons
- Confirms recipient count before firing

## Footer (every notification email)

```
Unsubscribe from [stream] emails  ·  Unsubscribe from all
```

Both links hit `handle-email-unsubscribe?token=…&stream=…`.

## Out of scope (for this build)

- Reply notifications on Bar forum threads (deferred — needs reply notification infra first)
- "We miss you" re-engagement (deferred — needs activity tracking)
- CV-stale reminders (deferred)
- In-app notifications bell

## Build order (suggested)

1. DB migration (stream column, notification_log, triggers)
2. Shared template scaffolding + footer component
3. Welcome email (smallest, validates pipeline)
4. Application status emails (instant, high-signal)
5. Vacancy + Bar daily digests
6. Profile nudge + Sunday recap
7. Admin broadcasts UI + send function
8. Memory update: replace the "no transactional emails" rule with the new policy

Ready to implement. Approve and I'll start with the migration + welcome email as the first deployable slice.