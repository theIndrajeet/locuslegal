## Diagnosis

The Updates broadcast is **not working**. When you clicked "Send test to me", the dispatcher ran successfully (HTTP 200), but its internal call to `send-transactional-email` returned **HTTP 401 Unauthorized**, so no email was ever enqueued. The toast said "Test sent" because the dispatcher swallowed the failure.

Evidence:
- `email_send_log` table is **empty** (0 rows ever).
- Edge logs show `POST /send-transactional-email → 401` immediately after the dispatcher ran.
- `send-transactional-email` has zero invocation logs (gateway rejected before code ran).
- The "Test Email" row is stuck at `status = draft`.

### Why it 401s
`supabase/functions/dispatch-updates-broadcast/index.ts` calls `send-transactional-email` via raw `fetch` with `Authorization: Bearer <SERVICE_KEY>`. The gateway's `verify_jwt = true` check rejects this in some configurations. The supported pattern (used everywhere else and recommended in the transactional-emails docs) is `supabase.functions.invoke(...)` from a service-role client — that handles auth headers correctly.

## Fix

**File:** `supabase/functions/dispatch-updates-broadcast/index.ts`

1. Replace the hand-rolled `invokeSend` `fetch` helper with a service-role `supabase.functions.invoke('send-transactional-email', { body: ... })` call.
2. Treat any non-2xx / error response as a real failure (count it, log it) instead of silently returning `ok: true`.
3. For the **test-send** path, surface the underlying error to the toast so future failures are visible — return `{ ok: false, error }` with HTTP 502 when the inner call fails, instead of `{ ok: true, result }`.

**File:** `src/pages/AdminUpdates.tsx`

4. In `handleTestSend` and `handleSendAll`, check the returned payload for `ok === false` and show the actual error message in the toast (currently only network-level errors throw).

No DB schema changes, no new functions, no new templates. Only the dispatcher's call style and the client's error handling change.

## Verification after the fix

1. Click **Send test to me** in `/admin/updates`.
2. Confirm the toast shows success **and** a row appears in `email_send_log` with `template_name = 'updates-broadcast'`, `status = 'pending'` then `'sent'` within ~10s.
3. Check inbox.
4. The Email Log dashboard should then show the unique send.

## Files changed
- `supabase/functions/dispatch-updates-broadcast/index.ts` — switch to SDK invoke + propagate errors
- `src/pages/AdminUpdates.tsx` — show real error in failure toast
