

# Username Login + "Vote" Label

## Summary

Keep email for registration, but use **username** (display name) for login. Add "Vote"/"Voted" text to the heart button.

## How username login works

Supabase requires email for auth. The approach: on signup, store the username as `display_name` in profiles (already happens). On login, look up the user's email from the `profiles` table by display_name, then sign in with that email + password.

This requires a database function since profiles RLS doesn't expose emails — we need a `SECURITY DEFINER` function that takes a username and returns the matching email from `auth.users`.

## Changes

### 1. Database — new function `get_email_by_username`
- Create a `SECURITY DEFINER` function that joins `profiles.id` → `auth.users.id` to find the email for a given `display_name`
- Returns `text` (the email) or null if not found

### 2. `src/pages/Auth.tsx`
- **Signup form**: Keep Email + Password fields. Rename "Display Name" to **"Username"** (required, no spaces). This becomes their login identity.
- **Login form**: Show **Username** + **Password** fields (no email field). On submit, call the `get_email_by_username` RPC to resolve the email, then `signInWithPassword` with that email.
- Keep "Forgot password" for the signup/email flow only (remove from login view since there's no email field there).

### 3. `src/components/FeatureVoteButton.tsx`
- Add **"Vote"** text next to the heart icon
- When voted, show **"Voted"** in red instead

## Files

| Action | File |
|--------|------|
| Migration | Create `get_email_by_username` function |
| Edit | `src/pages/Auth.tsx` — username login, email signup |
| Edit | `src/components/FeatureVoteButton.tsx` — add Vote/Voted label |

