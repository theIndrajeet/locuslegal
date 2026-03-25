

# Fix Profile Edit Page & Show Username in Menu

## Problems

1. **Profile edit page stuck on "Loading..."** — the `.single()` call fails if no profile row exists for the user (e.g. if the trigger didn't fire for OAuth users). Need to use `.maybeSingle()` and handle the missing-row case.
2. **Menu shows email instead of username** — same `.single()` issue in ProfileMenu, plus the Google OAuth user may not have set a username yet. Should always prefer `display_name` and only fall back to email.

## Changes

### 1. Fix `src/components/ProfileMenu.tsx`
- Change `.single()` to `.maybeSingle()` in `fetchDisplayName`
- Keep showing `displayName || session.user.email` (this part is fine, just needs the query fix)

### 2. Fix `src/pages/ProfileEdit.tsx`
- Change `.single()` to `.maybeSingle()` in the useEffect query
- If no profile row exists, still allow editing (upsert instead of update in `handleSaveUsername`)
- Use `upsert` with `{ onConflict: 'id' }` so it creates the profile if missing

### 3. Fix `src/components/Layout.tsx`
- Change `.single()` to `.maybeSingle()` so it doesn't error when no profile exists

## Files

| Action | File |
|--------|------|
| Edit | `src/components/ProfileMenu.tsx` — `.single()` → `.maybeSingle()` |
| Edit | `src/pages/ProfileEdit.tsx` — `.single()` → `.maybeSingle()`, `.update()` → `.upsert()` |
| Edit | `src/components/Layout.tsx` — `.single()` → `.maybeSingle()` |

