## Why you see the spinner

Each non-home route is its own JS chunk (the code-split we shipped last round). The first time you visit a route in a session, the browser downloads that chunk → `Suspense` shows `RouteFallback` (centered spinner on a blank page). Second visit is instant because the chunk is cached. That's why it only happens "once per tab."

Goal: make the **first** visit feel instant too.

## Changes

### 1. `src/lib/prefetch.ts` (new)
Central registry mapping route paths → the same dynamic `import()` calls used by `lazy()`. Exposes:
- `prefetchRoute(path)` — fires the import (browser caches the chunk, React reuses it).
- `prefetchAll()` — kicks off all common routes during idle time.

This way `lazy(() => import('./pages/Tools'))` and `prefetchRoute('/tools')` resolve to the **same module promise**, so the chunk is downloaded only once.

### 2. `src/App.tsx`
- Move the dynamic imports into `prefetch.ts` and reference them from both `lazy(...)` and the prefetch registry.
- Replace `RouteFallback` (centered spinner on blank page) with a **`TopProgressBar`** component: a 2px yellow bar that animates across the top of the viewport while a chunk loads. The previous page stays visible underneath, so navigation feels instant.
- After mount, schedule `prefetchAll()` via `requestIdleCallback` (with `setTimeout` fallback) so common routes (Directory, Playbook, Resources, Tools, The Bar) are warm before the user clicks.

### 3. `src/components/Navbar.tsx` + `src/components/MobileBottomDock.tsx`
- Add `onMouseEnter` / `onFocus` / `onTouchStart` handlers on each nav `<Link>` that call `prefetchRoute(l.href)`. By the time the user releases their click, the chunk is usually already downloaded.
- Same treatment on the mobile bottom dock so the same UX works on phones (touchstart fires before navigation).

### 4. `src/components/playbook/GuideCard.tsx` (light touch)
- Prefetch `PlaybookGuide` chunk on hover so opening a specific guide is also instant.

## Result

- **Hovering** a nav link silently downloads the chunk → click feels instant.
- **Idle prefetch** warms the top 5 routes within ~2s of landing on the home page.
- **Top progress bar** replaces the blank-page spinner: even when a chunk genuinely takes a moment, the user keeps seeing the previous page with a thin loading indicator — which is how Vercel, Linear, and GitHub feel.
- No regression in initial bundle size: chunks are still split, just downloaded smarter.

No backend or schema changes. Pure frontend perf work.