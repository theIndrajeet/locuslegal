

# Fix login redirect on preview

Login is succeeding (auth logs confirm it). Two bugs are sending you somewhere unexpected after sign-in.

## Bug 1 — Google/Apple OAuth ignores `?next=`

`src/pages/Auth.tsx` `handleSocialLogin` hardcodes `redirect_uri: window.location.origin`, sending users to `/` after OAuth, regardless of any `?next=/the-bar/challenge/:id` param. Email/password already respects `postLoginPath` — social login should too.

**Fix**: build an absolute redirect URL from `postLoginPath`:
```
const redirectTo = `${window.location.origin}${postLoginPath}`;
lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectTo });
```

## Bug 2 — `Layout.tsx` force-redirects every Google login to `/choose-username`

`src/components/Layout.tsx` checks `profiles.display_name` on every `SIGNED_IN` event. The `handle_new_user` trigger only sets `display_name` from `raw_user_meta_data.display_name`, which is empty for Google/Apple sign-ups. So your Google account has `username` populated but `display_name = ''`, meaning every login bounces to `/choose-username` — overriding wherever you tried to go.

**Fix**: change the gate to check `username` instead of `display_name`. The trigger always populates `username` (auto-derived from email when missing), so this gate only fires for genuinely missing usernames — which in practice is never under the current trigger, making the redirect effectively a no-op for normal users.

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("username")
  .eq("id", session.user.id)
  .maybeSingle();
if (!profile?.username || profile.username.trim() === "") {
  navigate("/choose-username");
}
```

## Bug 3 (defensive) — don't override an in-flight `?next=` redirect

Even after fix #2, the Layout listener fires on every login and could race with `Auth.tsx`'s `navigate(postLoginPath)`. Make the Layout redirect a no-op when the user is already on `/auth` (Auth.tsx handles the navigation itself):

```ts
if (location.pathname === "/auth" || location.pathname === "/choose-username") return;
```

This way Layout only intervenes for OAuth callbacks landing on `/` or other pages, and Auth.tsx remains in control of explicit email/password navigation.

## Files

**Modified**
- `src/pages/Auth.tsx` — pass `postLoginPath` into OAuth `redirect_uri`
- `src/components/Layout.tsx` — check `username` not `display_name`; skip when on `/auth` or `/choose-username`

## Out of scope
No DB changes. No changes to the trigger, RLS, or edge functions. No changes to the published-vs-preview OAuth config (auth itself is working — logs confirm successful logins).

## Definition of Done
- Logging in via Google or email/password from `/auth` lands on `/the-bar` (or `?next=/the-bar/...` target if set), not `/choose-username` or `/`.
- `/choose-username` only triggers for the rare case of a profile with a truly empty `username`.
- Fix verified on the preview URL — same code runs identically on published.

