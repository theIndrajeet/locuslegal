## Fix preview endpoint 401 in auth-email-hook

The `/preview` endpoint in `supabase/functions/auth-email-hook/index.ts` rejects Lovable's preview builder with 401 because it requires `Authorization: Bearer <LOVABLE_API_KEY>`, which the preview service doesn't send. That cascades into the "Template build failed" / 422 banner.

### Changes

1. **`supabase/functions/auth-email-hook/index.ts`** (lines 94–102)
   - Remove the `LOVABLE_API_KEY` / `Authorization` check inside `handlePreview`.
   - Keep CORS preflight handling and JSON body parsing intact.
   - The webhook handler (the other `LOVABLE_API_KEY` usage at line 135) stays untouched — only the preview path becomes open.

2. **Redeploy** `auth-email-hook`.

3. **Verify** by hitting `/preview` for `signup` and `recovery` and confirming a 200 with rendered HTML, then asking you to click Retry on the Emails banner.

### Not in scope (noted for later)

- `SENDER_DOMAIN` vs `FROM_DOMAIN` mismatch — does not block preview/build; can be aligned in a follow-up to tighten SPF/DKIM alignment.
