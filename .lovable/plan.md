## Audit Result: Emails Are Currently Broken

I checked every piece of the email pipeline. The good news: all three notification flows (Updates broadcast, New Bar Challenge, New Vacancy) are correctly wired into `send-transactional-email`, the templates are registered, and the queue/cron is in place.

**The bad news:** the project's verified email domain was switched to **`notify.mail.locus.legal`**, but the sender Edge Function is still hardcoded to the OLD subdomain **`notify.locus.legal`** (which is no longer the active project domain). Every send will be rejected by the email API with "No email domain record found".

### Current state
| Component | Status |
|---|---|
| Verified domain | `notify.mail.locus.legal` ✅ |
| `send-transactional-email` SENDER_DOMAIN | `notify.locus.legal` ❌ stale |
| `send-transactional-email` FROM_DOMAIN | `locus.legal` ✅ ok |
| Updates broadcast → `updates-broadcast` template | ✅ wired |
| New Bar Challenge → `new-bar-challenge` template | ✅ wired (DB trigger → `dispatch-content-notification`) |
| New Vacancy → `new-vacancy` template | ✅ wired (DB trigger → `dispatch-content-notification`) |
| Queue dispatcher (`process-email-queue`) | ✅ deployed |
| Suppression + unsubscribe flow | ✅ working |

### The fix (one-line code change + redeploy)

1. Update `supabase/functions/send-transactional-email/index.ts`:
   - `SENDER_DOMAIN = "notify.mail.locus.legal"` (was `"notify.locus.legal"`)
   - Leave `FROM_DOMAIN = "locus.legal"` so the From header still reads `noreply@locus.legal` (cleaner branding).
2. Redeploy `send-transactional-email` (mandatory — Edge Functions serve last-deployed code).
3. Verify by sending a test from `/admin/updates` ("Send test to me") and watching `Cloud → Emails` for a `sent` row.

### After the fix — what will work automatically
- **Updates broadcast** (`/admin/updates`): admin-triggered, sends to all auth users + waitlist.
- **New Bar Challenge**: when an admin sets a challenge to `status='approved'`, the Postgres trigger fires `dispatch-content-notification` → emails every user.
- **New Vacancy**: when a vacancy goes `status='live'`, the same trigger fires → emails every user.
- All three respect the suppression list and per-recipient unsubscribe tokens.

### Not changed
No template, no DB schema, no trigger, no queue config — only the stale subdomain constant.

Approve and I'll apply the one-line fix and redeploy.