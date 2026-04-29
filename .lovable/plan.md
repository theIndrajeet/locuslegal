## Status

The pipeline is correctly installed:
- Triggers `vacancies_notify_new_after_iu` and `bar_challenges_notify_new_after_iu` are attached and enabled.
- Edge function `dispatch-content-notification` is deployed and authenticating correctly (verified in prior turn).
- Vault secret `email_queue_service_role_key` exists.

But it has never actually fired a notification:
- All `notified_at` columns are NULL.
- `email_send_log` has zero rows for `new-vacancy` or `new-bar-challenge`.

Reason: the only live vacancy (Lexmanus) and all approved bar challenges were created BEFORE the trigger was installed. The trigger only fires on INSERT or status-change UPDATE — it does not retroactively fire for existing rows.

## Plan: run a real end-to-end test

### Option A (recommended): re-fire the existing live vacancy
Update the Lexmanus vacancy to flip its status off and back on. This will cause the trigger to fire `dispatch_content_notification('vacancy', <id>)`, which calls the edge function, which queues real emails to **every user in the project**.

```sql
-- Step 1: temporarily archive
UPDATE vacancies SET status = 'archived' WHERE id = '61638046-...';
-- Step 2: republish (this fires the trigger)
UPDATE vacancies SET status = 'live', notified_at = NULL WHERE id = '61638046-...';
```

Then verify within ~30 seconds:
- `vacancies.notified_at` becomes non-NULL
- `email_send_log` shows rows with `template_name = 'new-vacancy'`, status `pending` then `sent`
- `dispatch-content-notification` logs show the run and recipient count
- `process-email-queue` logs show batches being drained

**Caveat:** This sends a real email blast to every registered user. If you'd rather not spam everyone for a test, use Option B.

### Option B (safer): dry-run with a non-existent ID
Manually invoke the dispatcher SQL helper with a real vacancy ID but use a one-off "test only" admin account as the sole recipient. This requires a small temporary code change to the edge function (add a `?test_email=you@x.com` override), which I can revert immediately after.

### Option C (also safe): just wait for the next real post
Next time a vacancy is published or a bar challenge is approved through the admin UI, the trigger will fire automatically. I can verify it then.

## Recommendation

If you have ~5 active users on the project, **Option A** is best — it's a real test, the email is genuinely useful (it's the live Lexmanus role), and it costs nothing. Tell me to proceed and I'll run it and report back with the email log results.

If you want to avoid blasting users, pick **Option C** — the wiring is verified at the database/auth layer and will fire on the next genuine event.

Which would you like?
