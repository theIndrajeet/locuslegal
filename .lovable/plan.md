I understand. I’m treating this as the last attempt and I’m not going to touch random parts of the app.

Do I know what the issue is? Yes.

The actual issue is:

```text
The admin dispatcher is now calling the email sender,
but the email sender is rejected before its code runs because gateway JWT validation says:
UNAUTHORIZED_INVALID_JWT_FORMAT / Invalid JWT
```

That explains every symptom:

- The toast still says `Edge Function returned a non-2xx status code`
- The sender function has no logs
- `email_send_log` is empty
- No queue rows are created
- Nothing reaches the inbox

The fix is to stop making these internal email functions depend on gateway JWT validation, and instead validate the backend service secret inside the function code.

Implementation plan:

1. Fix the sender function auth gate
   - Update `supabase/config.toml`
   - Change `send-transactional-email` from gateway JWT validation to in-function service-secret validation
   - Add an explicit authorization check at the top of `supabase/functions/send-transactional-email/index.ts`
   - Only allow requests where the bearer token matches the backend service secret

2. Fix the queue worker auth gate too
   - Update `process-email-queue` the same way
   - This is necessary because after the sender starts queueing emails, the queue worker still has to run and send them
   - Replace its current JWT role parsing with service-secret validation

3. Keep the admin page locked down
   - Do not weaken `/admin/updates`
   - The dispatcher remains admin-only
   - The admin role check remains server-side
   - Only the internal sender and queue worker change auth strategy

4. Deploy only the required backend functions
   - Deploy `send-transactional-email`
   - Deploy `process-email-queue`
   - Deploy `dispatch-updates-broadcast` only if the dispatcher code needs a small compatibility tweak

5. Verify before calling it fixed
   - Trigger the test-send path
   - Check that the sender now runs
   - Check `email_send_log`
   - Expected progression:

```text
pending -> sent
```

If it gets `pending` but not `sent`, then the current blocker is fixed and the next issue would be queue delivery. I will not call that “done” unless the log proves it.

Expected result after this fix:

```text
/admin/updates Send test to me
  -> admin dispatcher accepts your admin session
  -> internal sender accepts backend service-secret auth
  -> sender queues the email
  -> queue worker accepts scheduled backend auth
  -> email is sent
  -> email_send_log shows the final status
```

This is the narrowest fix for the exact `Invalid JWT` failure shown in the live logs.

<lov-actions>
<lov-open-history>View History</lov-open-history>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>