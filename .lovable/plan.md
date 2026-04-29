# Fix: dispatcher rejects vault service-role key (401)

## What I tested

I ran an end-to-end check on the new content-notification system:

- Migration applied — `notified_at` columns and triggers exist on both tables.
- Trigger functions registered correctly.
- Edge function `dispatch-content-notification` deployed.
- I called the SQL helper `dispatch_content_notification('vacancy', <fake-id>)` to simulate a trigger firing. It correctly invoked the edge function via `pg_net`.

## Bug found

The edge function returned **401 unauthorized**.

**Cause:** The trigger pulls the service-role bearer from the vault secret `email_queue_service_role_key`, but the dispatcher checks for byte-equality against the current `SUPABASE_SERVICE_ROLE_KEY` env var. The vault token was issued before the latest key rotation, so the bytes differ — even though it's still a valid service-role JWT.

This is the exact same problem `process-email-queue` already solved, and the fix is the same.

## Fix

Update `supabase/functions/dispatch-content-notification/index.ts` to authorize the caller if **either**:
1. The bearer matches `SUPABASE_SERVICE_ROLE_KEY` exactly, **or**
2. The bearer is a valid JWT whose `role` claim is `service_role`.

This is a copy of the proven pattern in `process-email-queue` and makes the dispatcher resilient to service-role key rotations.

## After applying

I'll re-fire the SQL helper with a fake ID and confirm the response is `404 vacancy not found` instead of `401`. That proves the trigger → edge function path is fully wired. I'll **not** trigger a real broadcast to your 16 users without your explicit go-ahead.

## Files

- `supabase/functions/dispatch-content-notification/index.ts` — replace the auth check block (~6 lines).

Approve and I'll patch and re-verify.
