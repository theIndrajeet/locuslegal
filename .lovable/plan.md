# Route Skeletons for Faster-Feeling Navigation

## Problem

Today, the global Suspense fallback in `App.tsx` is just a 2px `<TopProgressBar />` at the top of the screen. While a route chunk downloads (or while the new page does its initial Supabase fetch), users see:

- The previous page disappear instantly
- A blank black screen with only the navbar/footer + a thin yellow line
- Then the real page snaps in

This reads as "the app froze" even when the actual wait is 200–600ms. We already have nice skeletons inside `AppHome`, `TheBar*`, `ProfileEdit`, etc., but they only render *after* the chunk loads — the gap before that is still blank.

## Goal

Show a **route-shaped skeleton** during both phases (chunk download + initial data fetch) so every navigation feels like the new page is already there, just hydrating.

## Approach

### 1. Create a `RouteSkeleton` component

New file `src/components/RouteSkeleton.tsx` that:

- Reads the current pathname via `useLocation()`
- Picks a skeleton "shape" preset based on the path (matched with the same regex table as `prefetchRoute`)
- Renders neobrutalist skeleton blocks (using existing `Skeleton` from `@/components/ui/skeleton`) wrapped in the standard page padding (`pt-20 px-4 max-w-6xl mx-auto`)
- Always renders `<TopProgressBar />` on top so the yellow line still gives motion feedback

Skeleton shape presets (kept lightweight — 4–6 blocks each, no animation beyond the existing `animate-pulse`):

| Route prefix | Shape |
|---|---|
| `/app` | Identity row + strength meter bar + 3-column pane grid |
| `/the-bar`, `/the-bar/browse` | Stats strip + grid of 6 challenge cards |
| `/the-bar/challenge/*` | Tall question card + answer area |
| `/the-bar/leaderboard`, `/history` | Header + 8 list rows |
| `/directory` | Filter bar + map placeholder + 6 firm cards |
| `/playbook`, `/resources`, `/tools` | Header + 3-col card grid |
| `/playbook/:slug` | Title block + paragraph lines (article shape) |
| `/applications` | Stats strip + 5 row table |
| `/profile/edit`, `/u/:username` | Avatar + 4 form sections |
| `/auth`, `/choose-username`, `/reset-password` | Centered card with input rows |
| `/admin/*`, `/waitlist`, `/beta`, fallback | Header + generic stack of 4 blocks |

A small `getRouteShape(pathname)` function (mirroring `pathToKey` in `lib/prefetch.ts`) returns which preset to render. Default fallback = generic stack.

### 2. Wire it into the global Suspense

In `src/App.tsx`, change:

```tsx
<Suspense fallback={<TopProgressBar />}>
```

to:

```tsx
<Suspense fallback={<RouteSkeleton />}>
```

`RouteSkeleton` itself includes `<TopProgressBar />` so we keep the existing motion cue.

### 3. Reuse the same component for in-page initial loads (optional, cheap win)

`AppHome.tsx` already renders its own ad-hoc skeleton block while `loading` is true. We'll leave that as-is — it's already a skeleton — but make sure its shape matches what `RouteSkeleton` shows for `/app`, so the chunk-load skeleton → data-load skeleton transition is seamless (no visual jump).

If the shapes match closely enough, the user perceives one continuous skeleton instead of two flashes.

## Technical notes

- `RouteSkeleton` must not import any heavy dependencies — only `react-router-dom` (already in critical bundle), `@/components/ui/skeleton` (~20 LOC), and `TopProgressBar`. No Supabase, no auth, no icons that pull a chunk.
- All skeleton blocks use `bg-card border-2 border-border` to match the neobrutalist aesthetic. No emojis, no rounded radii beyond what `Skeleton` provides.
- The fallback renders inside `<Layout>` for nested routes (Navbar/Footer stay), and as a full-screen card for top-level routes like `/auth` (which lives outside Layout). The shape preset accounts for this — auth routes use a centered card; everything else uses the page padding.
- Total bundle impact: ~1.5 KB gzipped, all in the critical chunk. No new lazy boundaries.

## Files

- **New**: `src/components/RouteSkeleton.tsx`
- **Edit**: `src/App.tsx` (swap one line in the Suspense fallback)

## Out of scope

- Animating between skeleton → real content (would require a coordinated cross-fade and isn't worth the complexity now)
- Per-page custom skeletons inside each route file (the existing in-page skeletons stay; we're only fixing the *blank chunk-load* gap)
- Changing the home page (it isn't lazy-loaded, so it never shows a fallback)
