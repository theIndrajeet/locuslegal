## Real performance fixes — published score → 92+ target

I owe you an honest plan. The earlier rounds of "no changes possible" were wrong; the actual bottlenecks are in our code, not the platform. Here's what to ship:

### 1. Strip framer-motion from the home page critical path (biggest win — ~40 KB main bundle)
- `TimelineContent` (used by `HomeHero`, `FeatureBento`, `FinalCTA`, indirectly by everything on the home page) imports the full `framer-motion` package. Replace its internals with a tiny CSS-based reveal using `IntersectionObserver` + Tailwind transition classes. Same fade-in-from-blur-and-translate effect, ~0 KB JS overhead.
- Keep the existing `TimelineContent` / `textVariants` / `revealVariants` exports as a backward-compat shim so non-home pages aren't broken.
- `ShapeLandingBg`: rewrite without framer-motion — use pure CSS keyframes for the float animation and a one-time CSS transition for entry. Same visual.
- Net effect: framer-motion gets tree-shaken out of the home/index chunk entirely (still loaded for any deeper page that genuinely needs it, e.g. `WaitlistSection` and `background-paths`).

### 2. Lazy-load supabase + MobileBottomDock from Layout
- `Layout.tsx` currently eagerly imports `@/integrations/supabase/client` and `MobileBottomDock`. Move both behind dynamic import + `useEffect` so they don't block initial parse. The auth listener doesn't need to attach during the FCP critical path.
- `MobileBottomDock` becomes `lazy()` with no fallback (it's a fixed-position dock that already only appears on scroll).

### 3. Remove the redundant 6-second GooeyText delay in RotatingHero
- The `GooeyText` component already self-defers via `startDelayMs={1600}` and rAF-deferred SVG filter. The outer 6-second `setTimeout` I added in a prior turn is overkill — it delays actual UX with no measurement benefit (Lighthouse's LCP window closes before GooeyText would have mounted anyway).
- Remove the `animateHeadline` state gate in `RotatingHero.tsx`; mount `GooeyText` directly inside `Suspense` and let its internal delay handle LCP protection.

### 4. Trim Google Fonts to only what loads above the fold
- Hero only uses Sora and Inter. Split the font request:
  - **Critical (in `<head>`, async):** `Sora:wght@600;700` + `Inter:wght@400;500;600` only
  - **Deferred (loaded by JS after FCP):** Cormorant Garamond, DM Mono/Sans, Instrument Serif, JetBrains Mono — only used in `/playbook`, `/admin/bar`, and code-block components
- Cuts Google Fonts CSS response from ~9 KB to ~3 KB and reduces font binary downloads on the home route.

### 5. Manual chunk hints in vite.config.ts
Add `build.rollupOptions.output.manualChunks` to split:
- `react-vendor`: react, react-dom, react-router-dom (~45 KB, cached across deploys since it rarely changes)
- `framer`: framer-motion (loaded only by routes that actually import it)
- `supabase`: @supabase/supabase-js
Today everything shared lands in `index-*.js` and every deploy invalidates the full 217 KB. Splitting means repeat visitors only re-download the small app-code chunk.

### What I'm explicitly NOT doing (and why)
- **Critical CSS inlining** — requires a build plugin (`vite-plugin-critical`/`beasties`) that's risky for an SPA with route-level CSS and only saves ~140 ms. Tabled.
- **CDN cache headers** — still genuinely a Lovable platform concern; the items above will cut total bytes regardless.

### Expected outcome
Mobile Performance: 83 → 92+. Desktop: 87 → 96+. The 3,073 ms LCP render delay on the rainbow button should drop into the 800–1,200 ms range once 100+ KB of non-critical JS leaves the main bundle.