

# Fix: Rit couldn't reply (edge function crash)

The `rit-chat` edge function is crashing with `userClient.auth.getClaims is not a function`. The Supabase JS runtime in the deployed function doesn't expose `getClaims()`. The auth check needs to use the standard `auth.getUser(token)` instead.

## Fix

In `supabase/functions/rit-chat/index.ts` (lines 106–111), replace:

```ts
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
if (claimsErr || !claimsData?.claims?.sub) {
  return jsonResponse(401, { error: "unauthenticated" });
}
const userId = claimsData.claims.sub as string;
```

with:

```ts
const token = authHeader.replace("Bearer ", "");
const { data: userData, error: userErr } = await userClient.auth.getUser(token);
if (userErr || !userData?.user?.id) {
  return jsonResponse(401, { error: "unauthenticated" });
}
const userId = userData.user.id;
```

Then redeploy `rit-chat`. No other files change. RLS, ownership check on `bar_attempts.user_id === userId`, message cap, and the rest of the handler remain identical.

## Files

**Modified**
- `supabase/functions/rit-chat/index.ts` — swap `auth.getClaims(token)` for `auth.getUser(token)` (5 lines)

**Unchanged**
- `RitChatPanel`, demo mode, DB schema, RLS, all UI

## Definition of Done

After redeploy: on a real post-attempt screen, opening Rit and tapping a starter chip returns a real AI reply within ~5s instead of "Rit couldn't reply." Edge function logs no longer show the `getClaims is not a function` TypeError. Demo mode at `/the-bar/preview` is unaffected.

