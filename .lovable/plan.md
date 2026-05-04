# Switch sender domain to `open.locus.legal`

## Status check
- `open.locus.legal` → **Verified ✅** (NS delegation active, ready to send)
- `auth.locus.legal` → not the active verified subdomain (previous attempt)
- Edge functions still hardcode `SENDER_DOMAIN = "auth.locus.legal"` → every send currently rejected by the email API with "No email domain record found"

## Changes

### 1. `supabase/functions/send-transactional-email/index.ts`
- `SENDER_DOMAIN`: `"auth.locus.legal"` → `"open.locus.legal"`
- Keep `FROM_DOMAIN = "locus.legal"` (cosmetic From header — unchanged, sends still appear as `noreply@locus.legal`)

### 2. `supabase/functions/auth-email-hook/index.ts`
- `SENDER_DOMAIN`: `"auth.locus.legal"` → `"open.locus.legal"`
- Keep `ROOT_DOMAIN` and `FROM_DOMAIN` as `locus.legal`

### 3. Auth email template footers (4 files)
Update displayed footer line for brand accuracy:
- `_shared/email-templates/email-change.tsx`
- `_shared/email-templates/magic-link.tsx`
- `_shared/email-templates/reauthentication.tsx`
- `_shared/email-templates/recovery.tsx`

Change footer text `"Locus by LexRoot · auth.locus.legal"` → `"Locus by LexRoot · locus.legal"` (drop the technical subdomain — users see the brand domain, not the sender infra subdomain). Note: `signup.tsx` and `invite.tsx` already don't carry the bad string — verify and align.

### 4. Redeploy edge functions
After file edits, deploy the two functions whose code changed:
- `send-transactional-email`
- `auth-email-hook`

(Templates live under `_shared/` and are bundled into both functions at deploy time, so deploying these two ships the footer updates as well.)

### 5. Save memory note
Add `mem://fixes/sender-domain-switch-on-workspace-change` capturing the recurring fix:
> When the workspace changes and a new sender subdomain is provisioned (e.g. notify → auth → open), update `SENDER_DOMAIN` in `send-transactional-email/index.ts` AND `auth-email-hook/index.ts` to the new verified FQDN, then redeploy both. `FROM_DOMAIN` stays as the root `locus.legal`. Also update auth email template footer strings if they hardcode the subdomain.

## Out of scope
- No DB changes, no migrations, no infra rerun (`open.locus.legal` is already active)
- No client/UI changes
- No new templates

## Verification after deploy
- Trigger one auth email (password reset on test account) → confirm delivery
- Trigger one transactional (welcome on a test signup) → confirm delivery
- Check `email_send_log` for `sent` rows (no more `failed` with "No email domain record found")
