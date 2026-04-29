You’re right to be pissed. I checked the live backend logs and this is not fixed yet. My earlier “fully built and live” answer was wrong.

What is actually happening:

```text
Admin Updates page
  -> broadcast dispatcher runs
  -> dispatcher calls the internal email sender
  -> internal sender is rejected with 401 before its code even runs
  -> UI shows: Edge Function returned a non-2xx status code
```

The email domain itself is fine: `notify.locus.legal` is verified.

The real root cause is narrower: the sender is configured to require an authorization token, but the dispatcher’s internal call is reaching it without the required `Authorization` header. That is why:

- the sender logs are empty,
- the email queue is empty,
- `email_send_log` is empty,
- and the UI only gets the generic non-2xx error.

Plan to fix it:

1. Patch the broadcast dispatcher’s internal sender call
   - Stop relying on the current helper call that is dropping/omitting auth.
   - Call the internal email sender with explicit backend authorization headers.
   - Preserve the current admin-only protection on the public/admin-triggered dispatcher.

2. Improve the error response
   - If the sender fails again, return the actual status/body to the admin UI instead of only `Edge Function returned a non-2xx status code`.
   - This prevents us from debugging blind again.

3. Deploy the corrected backend dispatcher
   - Redeploy the updated broadcast dispatcher function.
   - The email sender itself should not need a domain/config change.

4. Run a real test send verification
   - Trigger the test-send path from the backend.
   - Confirm the email is either queued or sent in the email log.
   - Confirm the queue worker processes it instead of leaving it stuck.

5. Only after the test path passes, verify the UI
   - Use `/admin/updates` → “Send test to me”.
   - Confirm the toast changes from failure to success.
   - Confirm delivery/log status.

Expected result after the patch:

```text
Send test to me
  -> dispatcher authorized
  -> email sender receives request
  -> email is queued
  -> queue worker sends it
  -> admin sees success instead of the red failure toast
```

No DNS/domain change is needed. This is an internal backend auth wiring bug.