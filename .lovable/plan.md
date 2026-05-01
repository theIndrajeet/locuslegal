## Fix auth email "Template build failed"

The `auth-email-hook` Edge Function has a stale `SENDER_DOMAIN` constant pointing at the old subdomain `notify.locus.legal`. The active project domain is `notify.mail.locus.legal`. This breaks both the preview cache (red banner in Cloud → Emails) and would block live auth emails (signup confirm, password reset, magic link, invite, email change, reauth).

### Change
- `supabase/functions/auth-email-hook/index.ts` line 40:
  `SENDER_DOMAIN = "notify.mail.locus.legal"` (was `"notify.locus.legal"`)
- Redeploy `auth-email-hook`.
- After deploy, click **Retry setup** in Cloud → Emails to rebuild the preview cache.

No template, schema, or trigger changes.