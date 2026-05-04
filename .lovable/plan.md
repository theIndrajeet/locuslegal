You're right — this is the same class of bug we hit on 2026-04-29 when "Send test to me" first started working. I checked the chat history: the fix was applied to `send-transactional-email` and `process-email-queue` back then, but it was never written into project memory, so it wasn't applied to `send-broadcast` when that function started invoking `send-transactional-email` from inside another edge function.

## What is actually happening (confirmed in logs)

```text
send-broadcast            -> POST 500
  └─ supabase.functions.invoke("send-transactional-email")
       └─ POST 401 UNAUTHORIZED_INVALID_JWT_FORMAT
```

- `send-transactional-email` has `verify_jwt = true` in `supabase/config.toml`.
- The Supabase project uses the new signing-keys system, so `SUPABASE_SERVICE_ROLE_KEY` is in opaque `sb_secret_...` format.
- When `send-broadcast` calls `send-transactional-email` server-to-server, the SDK attaches that secret as `Authorization: Bearer ...`. The gateway tries to validate it as a JWT first and rejects it before the function code runs.
- Result: zero recipients, zero rows in `email_send_log`, generic 500 toast.

## Why the previous "fix" didn't catch this

Back on 2026-04-29 we applied the right fix only to:
- `send-transactional-email` (later flipped back to `verify_jwt = true` somewhere along the way), and
- `process-email-queue`.

We never saved the rule, so when `send-broadcast` was added with `verify_jwt = true` and started calling `send-transactional-email`, the same wall came back. Multiple other server-to-server callers exist now and will hit the same wall under the right conditions: `send-vacancy-instant`, `send-vacancy-digest`, `send-bar-digest`, `send-profile-nudge`, `send-application-recap`, `send-opportunity-digest`.

## Fix

1. Save the rule to memory so this never repeats.
   - New memory file: `mem://fixes/edge-function-invoke-401`.
   - Add a Core line referencing it.
   - Rule in plain English: any edge function invoked by another edge function or by pg_cron must have `verify_jwt = false` AND its own in-function service-role check.

2. Update `supabase/config.toml` so `send-transactional-email` is `verify_jwt = false` again. Leave `send-broadcast` as `verify_jwt = true` (it's user-triggered from the admin UI and benefits from gateway JWT). All other server-to-server callees (`process-email-queue`) stay `verify_jwt = false`.

3. Add an in-function auth gate to `send-transactional-email` that accepts EITHER:
   - byte-perfect match with `SUPABASE_SERVICE_ROLE_KEY` (the `sb_secret_...` format used by `supabase.functions.invoke` from another edge function), OR
   - any JWT whose payload `role === 'service_role'` (cron's vault token), OR
   - a normal user JWT — in that case still allow, since the same function is also invoked from the client during signup-time flows. Existing public-callable behavior stays intact.

   Implementation pattern (already proven to work last time):
   ```ts
   function parseJwtClaims(token: string) {
     try {
       const p = token.split('.')
       if (p.length !== 3) return null
       const pad = (s: string) => s + '='.repeat((4 - s.length % 4) % 4)
       return JSON.parse(atob(pad(p[1].replace(/-/g, '+').replace(/_/g, '/'))))
     } catch { return null }
   }
   const auth = req.headers.get('Authorization') || ''
   const tok = auth.replace(/^Bearer\s+/i, '').trim()
   const sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   const claims = parseJwtClaims(tok)
   const ok = !!tok && (tok === sk || (claims && (claims.role === 'service_role' || claims.role === 'authenticated' || claims.sub)))
   if (!ok) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
   ```

4. Redeploy `send-transactional-email` (config + code changes only take effect on deploy).

5. Improve `send-broadcast` to surface the real downstream error string in its 500 response, so future failures don't show the generic toast.

6. Improve the admin UI toast on `/admin/broadcasts` to show that error detail when present.

7. Test path:
   - Click "Send test to me" — expect a single email to admin, no `update_broadcasts` row, toast shows the recipient address.
   - Then send a small real broadcast and confirm `email_send_log` rows go `pending` → `sent`.

## Files changed

- `mem://fixes/edge-function-invoke-401` — new memory.
- `mem://index.md` — add Core line + index entry.
- `supabase/config.toml` — flip `send-transactional-email` to `verify_jwt = false`.
- `supabase/functions/send-transactional-email/index.ts` — add the in-function auth gate at the top of the handler.
- `supabase/functions/send-broadcast/index.ts` — return downstream error detail in the 500 body.
- `src/pages/AdminBroadcasts.tsx` — show that detail in the failure toast.

## What I will NOT touch (yet)

- I won't refactor every other server-to-server caller in this round. They're not broken right now because they don't get triggered through `send-broadcast`'s path. The memory will warn future-me to apply the same pattern when adding new ones, and we can sweep them in a follow-up if you want.
- I won't change `send-broadcast`'s own `verify_jwt = true` — the admin UI calls it with a real user JWT and that gate is correct.

Approve and I'll apply all of the above in one pass and validate with edge logs before claiming it works.