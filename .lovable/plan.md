

## Two-bug fix plan

### Bug 1 — `/profile/edit` skeleton hangs

**File:** `src/pages/ProfileEdit.tsx`

Refactor the data-fetch `useEffect` so loading state always resolves and we can see where it hangs:

- Wrap the entire `init()` body in `try / catch / finally`. The `finally` block calls `setLoading(false)` unconditionally (guarded by `mounted`).
- Split the calls so a failure in identities check can't take down the whole fetch:
  - `getSession()` in its own try/catch — on failure, log + toast + `setLoading(false)` and bail.
  - `getUser()` (identities) in its own try/catch — on failure, default `setHasPassword(true)` and continue.
  - `Promise.all` of profile/internships/moots/publications in its own try/catch — on failure, log error per-result and toast generic "Could not load profile data".
- Handle missing profile row: if `profileRes.data` is null AND there's no `profileRes.error`, console.error + `toast.error("Profile not found. Please sign out and sign back in.")`. Still flip `loading` off so the page renders (with empty fields) rather than hanging.
- Add labeled `console.log` breadcrumbs at each step:
  - `[ProfileEdit] init start`
  - `[ProfileEdit] session resolved` / `[ProfileEdit] no session, redirecting`
  - `[ProfileEdit] fetching identities` / `[ProfileEdit] identities fetched (hasPassword=...)`
  - `[ProfileEdit] fetching profile + lists`
  - `[ProfileEdit] profile fetched` (with row presence boolean, no PII)
  - `[ProfileEdit] internships/moots/publications fetched` (with counts)
  - `[ProfileEdit] init done` (in finally)
- Keep `mounted` guard checks before each `setState`.

No layout/form changes. No schema changes.

### Bug 2 — ProfileMenu missing Edit Profile / View My Profile

**File:** `src/components/ProfileMenu.tsx`

- Extend `fetchDisplayName` to also fetch `username` in the same select; store `username` in new state.
- Restructure the popover content into the required order, using a thin `<div className="h-px bg-border my-1" />` divider (component currently uses Popover, not DropdownMenu — keep Popover and its existing button pattern; "DropdownMenuSeparator" requested in spec is approximated by the divider div to avoid swapping the whole component).
- New order:
  1. Header: `displayName` on top line, `@username` muted on second line (fall back to email if no username yet).
  2. Divider
  3. **Edit Profile** (`User` icon) → `navigate("/profile/edit")`
  4. **View My Profile** (`ExternalLink` icon) → `navigate(\`/u/${username}\`)`. Only rendered when `username` is loaded.
  5. Divider
  6. Change Username (existing) → `/profile/edit`
  7. Change Password (existing handler unchanged)
  8. Divider
  9. Sign Out (existing)
- Imports add `User`, `ExternalLink` from `lucide-react`.
- All buttons close the popover (`setOpen(false)`) before navigating, matching existing pattern.

No changes to auth, /profile/edit forms, /u/:username, or DB.

### Files touched
- `src/pages/ProfileEdit.tsx`
- `src/components/ProfileMenu.tsx`

