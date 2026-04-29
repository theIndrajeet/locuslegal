# Automated Email Notifications: New Vacancies & New Bar Challenges

Send a branded email to **all users** automatically whenever:
1. A new **vacancy** is published (status `live`).
2. A new **Bar challenge** is approved (status `approved`).

No in-app preferences. Users opt out via the **one-click unsubscribe link** in the email footer (already system-managed and respected by the send pipeline).

---

## How it works

- Admin approves a Bar challenge (or publishes a vacancy) in the existing admin UI.
- A Postgres trigger fires once per row → calls a new edge function `dispatch-content-notification`.
- Function pages through all `auth.users`, filters out anyone in `suppressed_emails` (i.e. previously unsubscribed/bounced), and queues a templated email per recipient.
- Queue throttles, retries, and logs everything to `email_send_log` (visible in `/admin/emails`).
- Each email has the standard unsubscribe footer — clicking it adds the address to `suppressed_emails`, which automatically excludes them from all future sends.

---

## What gets built

### 1. Database (single migration)

- Add `notified_at timestamptz` to `vacancies` and `bar_challenges` (idempotency guard — a row can never trigger twice).
- Trigger function on `vacancies`: fires on INSERT/UPDATE when `status` becomes `'live'` and `notified_at IS NULL`.
- Trigger function on `bar_challenges`: fires on INSERT/UPDATE when `status` becomes `'approved'` and `notified_at IS NULL`.
- Both call `dispatch-content-notification` via `pg_net.http_post` with the service-role key (read from Vault, same pattern as `process-email-queue`) and payload `{ kind, id }`.

### 2. Edge function: `dispatch-content-notification`

- `verify_jwt = false`; validates the bearer is the service role.
- Loads the source row; bails if `notified_at` is already set (idempotent).
- Pages through all users via `auth.admin.listUsers`.
- Filters out addresses in `suppressed_emails`.
- Invokes `send-transactional-email` per recipient with `idempotencyKey = '{kind}-notify-{id}-{email}'`.
- Stamps `notified_at = now()` on the source row when done.

(Mirrors `dispatch-updates-broadcast` exactly, minus the admin auth check since the trigger calls it server-side.)

### 3. Two React Email templates

In `supabase/functions/_shared/transactional-email-templates/`:

- **`new-vacancy.tsx`** — Subject: `New vacancy at {firmName} — {role}`. Body: firm, role, location, brief description, "View vacancy" button → `/vacancies`.
- **`new-bar-challenge.tsx`** — Subject: `New challenge in The Bar — {areaOfLaw}`. Body: title, area, difficulty, "Take the challenge" button → `/the-bar/challenge/{id}`.

Both styled to match Locus (white email body, black borders, yellow accents). System auto-appends the unsubscribe footer.

### 4. Registry + config

- `registry.ts` — register both templates.
- `supabase/config.toml` — add `[functions.dispatch-content-notification]` with `verify_jwt = false`.

---

## Safety

- `notified_at` guard → no duplicate broadcasts, even if a row is re-saved.
- `suppressed_emails` is checked on every send → unsubscribed users never receive another email.
- Queue handles rate limits & retries automatically (~120 emails/min default).
- Full audit trail in `email_send_log` / `/admin/emails`.

---

## Files

**New**
- `supabase/migrations/<timestamp>_content_notifications.sql`
- `supabase/functions/dispatch-content-notification/index.ts`
- `supabase/functions/dispatch-content-notification/deno.json`
- `supabase/functions/_shared/transactional-email-templates/new-vacancy.tsx`
- `supabase/functions/_shared/transactional-email-templates/new-bar-challenge.tsx`

**Modified**
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `supabase/config.toml`

Approve and I'll build it.
