# Fix: Home button flashes marketing page → black screen → dashboard for logged-in users

## What's happening

When a logged-in user clicks **Home** in the navbar, they see three states in quick succession:

1. The marketing landing page (intended for logged-out visitors) — a "for ~1 second" flash.
2. A black/blank screen.
3. The actual logged-in dashboard at `/app`.

## Root cause

Two design choices currently combine to produce the glitch:

- **Navbar "Home" link always points to `/`** for everyone, logged in or not (`src/components/Navbar.tsx`).
- **`/` (Index page) defers the auth check** behind `requestIdleCallback` with up to a 4-second timeout (`src/pages/Index.tsx` → `DeferredAuthRedirect`). This was done intentionally to keep the Supabase chunk out of the home page's first paint for anonymous visitors. The trade-off is that returning logged-in users:
  1. See the marketing hero render first (flash 1).
  2. Then idle-time fires, auth resolves, and `navigate("/app")` runs.
  3. `/app` is `React.lazy`-loaded → its chunk hasn't downloaded yet → blank screen (flash 2).
  4. Dashboard finally renders (final state).

So the glitch is by design for cold visitors, but it's wrong for users who are already authenticated.

## Fix

Two small, complementary changes:

### 1. Make the Navbar "Home" link auth-aware
In `src/components/Navbar.tsx`, when the cached auth session shows the user is logged in, the **Home** link should point to `/app` instead of `/`. The auth state is already cached at module scope by `useAuthSession`, so reading it is free and adds no Supabase weight to first paint (the navbar already lazy-loads `ProfileMenu`, which pulls Supabase the same way).

To preserve the home-page bundle optimization for cold loads, we won't import `useAuthSession` eagerly. Instead, we'll use the same deferred-import pattern already used by `Index.tsx` and `AdminNavLink.tsx`: render the link as `/` initially, then swap to `/app` once the session hook has loaded and confirms a user.

This means:
- Anonymous visitors: link stays at `/` (no behavior change, no extra JS on first paint).
- Logged-in users: after the idle import (which is already happening because of `ProfileMenu`), the Home link silently retargets to `/app`. Clicking it goes straight to the dashboard.

### 2. Eager-prefetch `/app` for authenticated users
In `src/pages/Index.tsx`, when `DeferredAuthRedirect` discovers a session, kick off `prefetchRoute("/app")` **before** calling `navigate("/app")`. This guarantees the dashboard chunk is already in cache by the time the redirect fires, eliminating the black-screen flash (flash 2) for any user who still lands on `/` while logged in (e.g. typing the URL, external link, browser back button).

`prefetchRoute` already exists in `src/lib/prefetch.ts` and shares its module promise with `React.lazy`, so this is a one-line addition with no duplicate downloads.

### Result
- **Logged-in user clicks Home** → goes directly to `/app`, dashboard chunk is already prefetched, single clean transition. No marketing flash, no black screen.
- **Anonymous user clicks Home** → no change, marketing page renders instantly with zero Supabase in the critical bundle.
- **Logged-in user lands on `/` directly** (URL, bookmark) → still sees a brief landing render (unavoidable without shipping Supabase in the critical bundle), but the redirect to `/app` is now seamless because the chunk is prefetched.

## Files to edit
- `src/components/Navbar.tsx` — deferred-import `useAuthSession`, conditionally retarget the Home link to `/app` when a session exists.
- `src/pages/Index.tsx` — in `AuthRedirectInner`, call `prefetchRoute("/app")` as soon as a session is detected, before `navigate`.

No new dependencies, no DB or auth changes, no impact on the cold-visitor bundle.