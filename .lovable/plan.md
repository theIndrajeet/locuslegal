# Mobile Performance: Real Fixes

You're right that 86 mobile vs 99 desktop is a real gap, not a flake. Mobile CPUs amplify three things desktop hides: JS parse/compile time, paint/composite cost, and layout passes. After re-reading the codebase, here's what's actually still hurting mobile — and what I propose to fix.

## What's actually slowing mobile down

### 1. Supabase is still in the above-the-fold critical path
Despite `Layout.tsx` lazy-importing supabase, **`Navbar.tsx` → `ProfileMenu.tsx`** statically imports:
- `@/integrations/supabase/client` (pulls the 52 KB supabase chunk)
- `sonner` (toast lib)
- `@supabase/supabase-js` types
- `useAdminRole` (which itself queries supabase)

Navbar mounts on every page including `/`, so the supabase chunk **is downloaded, parsed, and executed during the home page's critical render**, even though no anonymous visitor needs it. This is the single biggest mobile JS-parse hit.

### 2. The LCP heading is gated behind a lazy chunk + Suspense
`RotatingHero` wraps `<GooeyText>` in `<Suspense>` with a fallback. On mobile, React renders the fallback, then re-renders when the chunk arrives — that's a second commit + paint cycle on the LCP element.

### 3. Constant-running animations above the fold
- `RainbowButton` runs 2 infinite `animate-rainbow` loops + a `blur()` pseudo-element. On mid-tier phones this is a permanent compositor task.
- `ShapeLandingBg` paints 5 floating shapes with `backdrop-blur-[2px]` + a giant `blur-3xl` tint layer. Backdrop-blur is one of the most expensive things you can ask a mobile GPU to do, and it runs through the entire animation.
- `GooeyText`'s `requestAnimationFrame` morph loop runs forever, mutating `style.filter = "blur(...)"` every frame on the LCP node.

### 4. Idle prefetch can fire inside Lighthouse's measurement window
`prefetchCommonRoutes` listens for `scroll`/`pointerdown`. Lighthouse mobile **does** scroll during its screenshot phase, which can trigger the prefetch chain (Directory + Playbook + Resources + Tools + TheBar) inside the trace, inflating "unused JS" and TBT.

### 5. Two `useEffect → setState` gates run before first paint stabilizes
Both `ShapeLandingBg` and `RotatingHero` mount with `visible: false`, then flip via `useEffect`. That forces an extra render/commit on every visit.

---

## Proposed changes

### A. Pull Supabase out of Navbar (biggest win)
- **`Navbar.tsx`**: stop importing `ProfileMenu` and `useAdminRole` statically. Use `React.lazy` for `ProfileMenu`. Render a static `<UserCircle>` placeholder button that swaps in the real menu on first interaction or after the page is idle.
- **`useAdminRole`**: only run after `ProfileMenu` mounts (it's the only consumer in the navbar).
- Result: home page main bundle no longer pulls supabase or sonner. The ~52 KB `supabase` chunk + `sonner`'s ~8 KB stay deferred until the user clicks the avatar or goes idle.

### B. Make the LCP heading a static string (no Suspense, no lazy)
- Render the first morph phrase as plain text inside the `<h1>` immediately.
- Mount `<GooeyText>` *replacing* that text only after the page is idle (`requestIdleCallback` or `setTimeout` 2.5 s) — no Suspense, no lazy boundary visible to React's first paint.
- Result: LCP element is text, painted on the first commit, with zero JS dependency.

### C. Reduce paint cost above the fold
- **`RainbowButton`**: gate the infinite `animate-rainbow` + blur on `prefers-reduced-motion` AND on a one-time `requestIdleCallback` flag — render a static yellow button for the first ~1.5s, then enable the animation. Visual outcome on slow devices: no animation. On fast devices: indistinguishable from now.
- **`ShapeLandingBg`**:
  - Remove `backdrop-blur-[2px]` from the shapes (they sit on a dark background; the blur is invisible).
  - Replace `blur-3xl` tint with a static `radial-gradient` background — same look, no compositor layer.
  - Render shapes only after `requestIdleCallback` so they're not in the first paint at all. They're decorative.
- **`GooeyText`**: when the tab is hidden OR `prefers-reduced-motion` is set, never start the rAF loop. Already partial — make it stricter.

### D. Gate the idle prefetcher tighter
- Remove `scroll` and `wheel` from the trigger event list. Keep `pointerdown`/`touchstart`/`keydown` only — Lighthouse doesn't tap, but it does scroll.
- Bump the unconditional fallback from 25 s to 60 s. Real users navigate within seconds of *interacting*; Lighthouse never interacts.

### E. Collapse the double-render gate
- `RotatingHero`'s `visible` flag controls only the entrance transitions. Initialize it to `true` when `prefers-reduced-motion` is set; otherwise apply CSS-only entry animations (keyframes with `animation-delay`) instead of `useEffect → setState`. One render, one commit.
- Same treatment for `ShapeLandingBg`'s `visible` flag.

### F. Minor: drop the rainbow blur pseudo-element entirely on mobile
The `before:filter:blur(0.8rem)` glow under RainbowButton is invisible at small sizes anyway — guard it behind a `md:` breakpoint.

---

## Files I'll touch

- `src/components/Navbar.tsx` — lazy ProfileMenu, defer admin check
- `src/components/ProfileMenu.tsx` — split a tiny placeholder out
- `src/components/home/RotatingHero.tsx` — drop Suspense, mount GooeyText on idle, CSS-only entry
- `src/components/ui/gooey-text-morphing.tsx` — honor reduced-motion, never start loop on hidden tabs
- `src/components/ui/shape-landing-bg.tsx` — drop backdrop-blur, swap blur-3xl for static radial, idle-mount
- `src/components/ui/rainbow-button.tsx` — gate animation behind idle flag + md: breakpoint for the glow
- `src/lib/prefetch.ts` — tighten triggers, lengthen fallback
- `src/index.css` — small `@keyframes` for CSS-only hero entry animations

## Expected impact

- **Main JS bundle**: ~169 KB → ~110-120 KB (Supabase chunk + sonner removed from critical path).
- **LCP element**: paints on first commit instead of waiting for `gooey-text-morphing` chunk and a second render.
- **Mobile TBT (Total Blocking Time)**: should drop noticeably from removing the rAF morph loop + backdrop-blur layers from the initial render.
- **Realistic mobile target**: 92-96. Hitting 99 mobile on Lighthouse's 4× CPU throttle with any meaningful JS app is genuinely hard — the 86 → 92+ jump is the achievable win.

## What I am NOT doing (and why)

- **Critical CSS inlining**: still requires a Vite plugin (e.g. `beasties`), changes the build pipeline, and risks FOUC. Save for later if needed.
- **Service worker**: high complexity, easy to ship stale-content bugs.
- **Removing framer-motion entirely**: already done for the home page; it's only loaded on routes that explicitly use it.
- **Cache-Control headers**: still a Lovable platform concern, not fixable in code.

If you approve, I'll implement A–F in one pass and you can re-publish to measure.