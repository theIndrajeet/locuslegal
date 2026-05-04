## Switch vacancy emails from daily digest → instant per-post

Right now vacancies sit until the 8 AM IST cron and go out as a digest (which also has the silent-failure bug we discussed). Better model for low volume: email subscribers the moment a vacancy goes live.

### Architecture

```text
Admin posts vacancy (status='live')
        ↓
DB trigger AFTER INSERT/UPDATE on public.vacancies
   when status transitions to 'live' AND notified_at IS NULL
        ↓
pg_net → send-vacancy-instant edge function (service role via Vault)
        ↓
For each profile email (excl. @locus.internal, excl. suppressed, excl. vacancy-stream unsubs):
   supabase.functions.invoke('send-transactional-email', { templateName: 'vacancy-instant', ... })
        ↓
Mark vacancies.notified_at = now() ONLY after enqueue loop completes with ≥1 success
```

### What gets built

**1. New edge function `send-vacancy-instant`**
- Input: `{ vacancyId: uuid }`
- Loads the vacancy (must be `status='live'` and `notified_at IS NULL`, else no-op)
- Lists auth users, filters out `@locus.internal` and pace-setters
- For each recipient: invokes `send-transactional-email` with `templateName: 'vacancy-instant'`, `idempotencyKey: vacancy-instant-{vacancyId}-{userId}`
- Logs every invoke error with `console.error` (fixes the silent-failure bug)
- Sets `notified_at` only if `enqueuedCount > 0`

**2. New transactional email template `vacancy-instant.tsx`**
- Single-vacancy layout: firm name, role, location, stipend, "Apply now" button → /vacancies
- Subject: `New vacancy: {role} at {firmName}`
- Registered in `_shared/transactional-email-templates/registry.ts`

**3. DB trigger `vacancies_notify_instant_fn`** (migration)
- AFTER INSERT OR UPDATE OF status ON public.vacancies
- Fires when `NEW.status='live' AND NEW.notified_at IS NULL AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'live')`
- Reads `email_queue_service_role_key` from Vault
- `pg_net.http_post` to `/functions/v1/send-vacancy-instant` with `{ vacancyId: NEW.id }`
- Wrapped in EXCEPTION WHEN OTHERS to never break inserts

**4. Backfill the 3 stuck vacancies** (Fair & Square Legal, Efficax, AMLEGALS)
- Reset `notified_at = NULL` so the new trigger picks them up on a one-shot manual invoke, OR call `send-vacancy-instant` directly for each ID. (Recommend the direct invoke — cleaner.)

**5. Retire the daily digest**
- Unschedule the `send-vacancy-digest` pg_cron job
- Leave the function file in place (inert) in case we want to revive it

### What stays the same
- `vacancy-digest` template (kept, unused for now)
- Per-user unsubscribe stream `vacancy` — `send-transactional-email` already enforces this via suppression checks

### Notes
- Throughput is fine: we have <50 profile emails today, instant fan-out via the queue is trivial
- Idempotency key per (vacancy, user) means double-trigger = no duplicate sends
- If a vacancy is edited later (e.g. role title change), it won't re-send because `notified_at` is set

Approve and I'll implement + deploy + backfill the 3 stuck ones in one go.