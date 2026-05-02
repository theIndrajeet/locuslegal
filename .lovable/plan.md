I’m sorry — you’re right to be frustrated. The Cloud screen is showing a real failure: the auth email preview cache cannot build, so the previous “it’s ready” answer was premature.

What I found from the read-only check:

- `auth.locus.legal` is verified.
- The project is currently configured in Cloud Emails as `locus.legal`, not the hardcoded values inside the auth email function.
- The deployed auth email function/templates still contain stale sender-domain references to `send.locus.legal`.
- The Cloud preview says “Template build failed / Preview cache build failed”, which usually means the deployed auth email function or templates need to be regenerated/redeployed against the current Cloud email configuration.
- The email queue tables and cron job exist, but older email send logs show “Emails disabled for this project” for app emails, so I will also ensure the Cloud email switch is enabled before retesting.

Plan to fix it:

1. Re-enable project emails
   - Ensure Cloud Emails is enabled so auth previews and sending are not blocked by the project-level email switch.

2. Refresh the shared email infrastructure
   - Run the managed email infrastructure setup again. This is safe/idempotent and refreshes the queue worker, credentials, cron scheduling, and sender configuration.

3. Regenerate the auth email function/templates against the current configured domain
   - Re-scaffold the auth templates with overwrite confirmation so stale `send.locus.legal` references are replaced with the currently configured Cloud email domain.
   - Keep Locus branding: black/white/yellow, Sora/Inter, neobrutalist borders and hard shadows.
   - Preserve the custom branded copy, but remove wrong sender-domain text.

4. Redeploy the email functions
   - Redeploy the auth email function so Cloud preview uses the latest code.
   - Redeploy the queue processor if the infrastructure refresh indicates it needs it.

5. Verify the fix
   - Open/check the auth preview path through Cloud by testing the password reset and signup previews.
   - Check function logs for startup/render errors.
   - Check the send log after a test password reset if needed.
   - Confirm whether Cloud preview now renders instead of showing “Failed to build preview”.

Expected result:

- The orange “Template build failed” banner should clear after retry/setup completes.
- Signup and password-reset previews should render in Cloud.
- Auth emails should use the verified Cloud email setup and the correct sender configuration instead of stale `send.locus.legal` values.