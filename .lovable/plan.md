

## Fix: parse-cv edge function crashes on every call

### Root cause

The edge function uses `authClient.auth.getClaims(token)`, which doesn't exist in `@supabase/supabase-js@2.45.0`. Every invocation throws `TypeError: authClient.auth.getClaims is not a function` and returns 500 in ~4ms — confirmed in the edge function logs. That's why your CV uploads but nothing fills in: the parse never actually runs against Gemini.

The frontend toast you may have seen ("CV parsing failed — please fill manually") is generic because the error path doesn't surface the underlying message when Supabase wraps it as a `FunctionsHttpError`.

### Change 1 — Replace `getClaims` with `getUser` in the edge function

**File:** `supabase/functions/parse-cv/index.ts`

Replace the auth verification block:

```ts
const { data: claims, error: authErr } = await authClient.auth.getClaims(token);
if (authErr || !claims?.claims?.sub) { ...401... }
userId = claims.claims.sub as string;
```

With the standard JWT verification that exists in supabase-js v2.45.0:

```ts
const { data: userRes, error: authErr } = await authClient.auth.getUser(token);
if (authErr || !userRes?.user?.id) { ...401... }
userId = userRes.user.id;
```

This validates the JWT against Supabase auth and returns the user id, which is what the rest of the function (path-prefix check, logging) expects. No other logic in the function changes.

### Change 2 — Surface the real error in the frontend toast

**File:** `src/components/profile/CvSection.tsx` (`runParse`)

When `supabase.functions.invoke` returns a `FunctionsHttpError`, `data` is sometimes null but the JSON error body is still readable from `error.context.response`. Improve the error toast so retryable/non-retryable messages from the edge function actually reach the user:

- When `error` is set, attempt to read the JSON body from `error.context?.response` (clone + `.json()`); fall back to `data` then `error.message`.
- Keep current behavior: show the specific message when `retryable === true`, otherwise show the generic "CV parsing failed — please fill manually".

This is purely a UX improvement so future failures aren't invisible.

### Verification after deploy

1. Edge function logs should show `outcome:"success"` with a duration in seconds (not 4ms with `TypeError`).
2. Click **Parse again** on the existing CV. Within 10–30s the review modal should open with parsed data.
3. If the AI returns nothing usable, the "couldn't extract much" info toast fires (modal does not open) — that's correct behavior, not a bug.

### Files touched
- `supabase/functions/parse-cv/index.ts` (auth call swap only)
- `src/components/profile/CvSection.tsx` (error message extraction in `runParse`)

### Not changed
- No schema changes, no RLS changes, no review modal changes, no other pages.

