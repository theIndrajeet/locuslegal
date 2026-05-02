# Plan: Remove transactional (app) email system

Keeps branded auth emails (signup / password reset / magic link / etc.) working as-is. Removes everything related to **app emails** — updates broadcasts, vacancy notifications, bar challenge notifications.

If you actually want auth templates gone too, say so and I'll extend this.

## What gets deleted

### Edge functions (full folders)
- `supabase/functions/send-transactional-email/`
- `supabase/functions/preview-transactional-email/`
- `supabase/functions/process-email-queue/`
- `supabase/functions/handle-email-unsubscribe/`
- `supabase/functions/handle-email-suppression/`
- `supabase/functions/dispatch-updates-broadcast/`
- `supabase/functions/dispatch-content-notification/`
- `supabase/functions/admin-email-log/`

Plus undeploy them via the Supabase tool so they stop responding.

### Templates
- `supabase/functions/_shared/transactional-email-templates/` (entire folder: `registry.ts`, `updates-broadcast.tsx`, `new-vacancy.tsx`, `new-bar-challenge.tsx`)

### Admin pages + routes
- `src/pages/AdminUpdates.tsx`
- `src/pages/AdminEmails.tsx`
- `src/pages/Unsubscribe.tsx`
- Remove their `<Route>` entries from `src/App.tsx`
- Remove the "Updates" and "Emails" tiles from `src/components/admin/AdminTiles.tsx` and any sidebar entries in `src/components/admin/AdminSidebar.tsx` / `AdminSubNav.tsx`

### Call sites (where `send-transactional-email` / `dispatch-content-notification` / `dispatch-updates-broadcast` are invoked)
I'll grep for `supabase.functions.invoke('send-transactional-email'`, `'dispatch-content-notification'`, `'dispatch-updates-broadcast'`, `'preview-transactional-email'`, `'admin-email-log'` and remove each call (and any surrounding "send notification" UI buttons in the admin vacancy / admin bar dialogs).

Likely affected files (to confirm during exploration):
- `src/pages/AdminVacancies.tsx` / `src/components/vacancies/AdminVacancyDialog.tsx`
- `src/pages/AdminBar.tsx` / `src/components/admin-bar/ChallengeForm.tsx`

### Config
- `supabase/config.toml`: remove the `[functions.*]` blocks for the deleted functions, leaving only `auth-email-hook`.

### Memory
- Update `mem://index.md` to remove "Updates Broadcast" and the "email log viewer" mention in "Admin Dashboard".
- Delete `mem://features/updates-broadcast`.

## What stays

- All auth templates in `supabase/functions/_shared/email-templates/` (signup, magic-link, recovery, invite, email-change, reauthentication)
- `supabase/functions/auth-email-hook/`
- Lovable Emails domain stays enabled — auth emails keep sending branded
- `email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens`, `email_send_state` DB tables and the `process-email-queue` cron remain untouched on the DB side. The queue dispatcher edge function gets removed, so the cron will start erroring on each tick. **I'll either (a) leave it — harmless but noisy in logs, or (b) drop the cron job via a migration.** I'll go with (b) — drop the `process-email-queue` cron job in a migration so logs stay clean. Tables stay (historical data, used by auth send log).

## Order of operations

1. Grep for all invocations of the deleted functions; list every file to edit.
2. Remove call sites + UI buttons.
3. Delete admin pages, remove routes, remove tiles/sidebar links.
4. Delete edge function folders.
5. Delete transactional template folder.
6. Update `supabase/config.toml`.
7. Migration: `SELECT cron.unschedule('process-email-queue');` (guarded with `IF EXISTS`).
8. Undeploy the removed edge functions.
9. Update memory.

## Risks / things you should know

- **Undoable via History tab**, but easier to do now than to manually rebuild.
- After this, posting a new vacancy or a new Bar challenge will **no longer email subscribers**. The Updates Broadcast admin tool is gone entirely.
- Auth emails (signup confirm, password reset) are untouched.
- If you want to add transactional emails back later, we'd re-scaffold the whole system from scratch.

Approve and I'll execute end-to-end.