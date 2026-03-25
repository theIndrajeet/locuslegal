

# Add Google + Apple Sign-In with Username Selection

## Summary

Add Google and Apple OAuth buttons to the auth page. After first OAuth sign-in, if the user has no username yet, redirect them to a "Choose your username" screen before they can proceed.

## Flow

```text
Auth Page
  ├── Email/password (existing)
  ├── "Continue with Google" button
  └── "Continue with Apple" button
         │
         ▼
  OAuth callback → check profiles table
         │
    has display_name? ──yes──→ redirect to /the-bar
         │
        no
         │
         ▼
  /choose-username page
    → user picks a username
    → upsert into profiles
    → redirect to /the-bar
```

## Changes

### 1. Configure Social Auth (tool call)
- Use the Configure Social Login tool to generate the `lovable` auth module for Google and Apple providers

### 2. Edit `src/pages/Auth.tsx`
- Add "Continue with Google" and "Continue with Apple" buttons below the email form
- Use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` and same for `"apple"`
- Visual separator ("or") between email form and social buttons

### 3. Create `src/pages/ChooseUsername.tsx`
- Simple page with a single input for username (no spaces, required)
- On submit: update the user's `profiles` row with `display_name`
- Redirect to `/the-bar` on success
- If user already has a display_name, redirect immediately

### 4. Edit `src/App.tsx`
- Add route `/choose-username` pointing to `ChooseUsername`

### 5. Update `handle_new_user` trigger function (migration)
- For OAuth users, Google/Apple won't pass `display_name` in metadata
- Set a sentinel default (e.g., empty string or null) so we can detect "needs username"
- Make `display_name` nullable or default to empty string for OAuth users

### 6. Create auth listener for username check
- In `Layout.tsx` or a shared auth context, after login detect if `profiles.display_name` is empty
- If so, redirect to `/choose-username`

## Files

| Action | File |
|--------|------|
| Tool   | Configure Social Login (Google + Apple) |
| Migration | Update `handle_new_user` to handle OAuth users without display_name |
| Edit   | `src/pages/Auth.tsx` |
| Create | `src/pages/ChooseUsername.tsx` |
| Edit   | `src/App.tsx` |
| Edit   | `src/components/Layout.tsx` (or create auth context) |

