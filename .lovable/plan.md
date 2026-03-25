

# Add Profile Icon to Navbar with Auth-Aware Menu

## Summary

Add a user/profile icon next to the theme toggle in both desktop and mobile navbar. Clicking it opens a dropdown: if not logged in, shows "Sign In"; if logged in, shows profile actions (change username, change password, sign out).

## Changes

### 1. Create `src/components/ProfileMenu.tsx`
- Shared component used in both desktop and mobile navbar areas
- Uses Popover (already available) for the dropdown
- On mount, subscribe to `supabase.auth.onAuthStateChange` to track session
- **Not logged in**: Show `UserCircle` icon → clicking opens popover with "Sign In" link to `/auth`
- **Logged in**: Show `UserCircle` icon (filled/accent) → popover with:
  - Display current username
  - "Change Username" → navigates to `/profile/edit`
  - "Change Password" → triggers `supabase.auth.resetPasswordForEmail` with user's email
  - "Sign Out" → calls `supabase.auth.signOut()` and redirects to `/`

### 2. Create `src/pages/ProfileEdit.tsx`
- Authenticated-only page (redirect to `/auth` if not logged in)
- Form to update `display_name` in profiles table
- Form to change password via `supabase.auth.updateUser({ password })`
- Both in one clean page

### 3. Edit `src/components/Navbar.tsx`
- Import and render `<ProfileMenu />` next to the theme toggle button in both desktop (`md:flex`) and mobile (`md:hidden`) sections

### 4. Edit `src/App.tsx`
- Add route `/profile/edit` → `ProfileEdit` inside the Layout wrapper

## Files

| Action | File |
|--------|------|
| Create | `src/components/ProfileMenu.tsx` |
| Create | `src/pages/ProfileEdit.tsx` |
| Edit   | `src/components/Navbar.tsx` |
| Edit   | `src/App.tsx` |

