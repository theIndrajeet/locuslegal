# Fix: Emails enqueue but never send

## Status right now

- ✅ "Send test" works — email is enqueued (`pending` row in `email_send_log` confirms it).
- ❌ The email never moves from `pending` → `sent`. It's stuck in the queue.
- ❌ `process-email-queue` boots every 5s (cron is firing) but does zero work — no batch logs, no errors.

## Root cause

The pg_cron job sends the request with the **vault'd service-role key** as the Bearer token. That token in the vault was stored when infrastructure was first provisioned and **may not be byte-identical** to the current `SUPABASE_SERVICE_ROLE_KEY` env var the function reads (key rotation, different signing key version, etc).

Our manual auth check does a **strict string equality**:
```
presentedToken !== supabaseServiceKey  →  401 Unauthorized (silent, no log)
```

So the cron hits the function, gets a silent 401, and exits before any processing log is emitted. That's why we see "booted" every 5s and nothing else.

This is the exact same class of issue we just fixed for the sender — the gateway-level JWT check moved into the function, and now the in-function check is too strict for the cron's stored token.

## The fix

Replace the strict equality check in `process-email-queue` with a proper JWT validation that accepts ANY valid service-role JWT (checking the `role` claim = `service_role`), not byte-equality with the env var.

### Changes

**`supabase/functions/process-email-queue/index.ts`** — replace the auth gate (lines ~94-104):

Instead of:
```ts
if (!presentedToken || presentedToken !== supabaseServiceKey) → 401
```

Use the existing `parseJwtClaims` helper already in the file:
```ts
const claims = parseJwtClaims(presentedToken)
if (!claims || claims.role !== 'service_role') → 401 with logged reason
```

Also add a `console.warn` before the 401 so future failures show up in logs instead of being silent.

**Apply the same JWT-claim check to `send-transactional-email/index.ts`** for consistency (currently uses strict equality — works today only because the dispatcher uses the env var directly, but will break if anything else calls it with a different valid service token).

### Verification

1. Redeploy both functions.
2. Wait ≤10s for next cron tick.
3. Query `email_send_log` — the existing `pending` row for `heyjeetttt@gmail.com` should flip to `sent`.
4. Check `process-email-queue` logs — should now show "processing batch" / send activity instead of just "booted".
5. Inbox check.

## Files changed

- `supabase/functions/process-email-queue/index.ts` (auth gate)
- `supabase/functions/send-transactional-email/index.ts` (auth gate, same pattern)

No DB migrations. No config.toml changes (those stay correct — `verify_jwt = false` for both).

## Confidence

High. The smoking gun is clear: sender enqueued successfully, queue worker boots but emits zero processing logs, and the only thing between "boot" and "process" is that strict-equality auth check.
