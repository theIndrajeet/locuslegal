# Self-host Sora (Option C)

Goal: remove Sora from the Google Fonts request so the LCP H1 paints in-brand on the first frame, with no swap and no extra round-trip.

## Changes

### 1. Add Sora `.woff2` files to `/public/fonts/`
Download the three weights actually used in the codebase:
- `sora-600.woff2` (semibold)
- `sora-700.woff2` (bold — used by H1, the LCP element)
- `sora-800.woff2` (extrabold)

Source: Google Fonts API `woff2` files (latin subset only — keeps each file ~12–18 KB).

### 2. Update `index.html`
- **Remove** Sora from the existing Google Fonts `<link>`. Keep Inter on Google Fonts (it's body text, not the LCP, and removing it would mean shipping 3 more woff2 files for marginal gain).
  - Before: `family=Sora:wght@600;700;800&family=Inter:wght@400;500;600`
  - After: `family=Inter:wght@400;500;600`
- **Add** a `<link rel="preload">` for `sora-700.woff2` (the H1 weight) before the stylesheet links so it starts downloading in the very first network burst.
  ```html
  <link rel="preload" href="/fonts/sora-700.woff2" as="font" type="font/woff2" crossorigin />
  ```
- **Add** an inline `<style>` block with `@font-face` declarations for all three Sora weights, using `font-display: swap` (safe because the file will already be cached/preloaded by the time text paints).

### 3. No changes to `tailwind.config.ts` or `index.css`
The `font-sora` Tailwind utility already references `'Sora', sans-serif` by family name — once the `@font-face` is registered, every existing `font-sora` class picks it up automatically. Zero component changes needed.

## Expected impact
- **Removes** one render-blocking external CSS request (Google Fonts `css2?family=Sora...` shaves ~80–150 ms on slow 4G).
- **Sora 700 arrives before first paint** for ~all visitors → LCP H1 renders in brand font on frame 1, no swap, no CLS.
- **Estimated Lighthouse mobile gain:** +3 to +5 points (mostly via FCP/LCP improvement).
- **Bundle cost:** ~14 KB (one woff2) added to critical path, but it replaces a ~20 KB Google Fonts CSS + font-file chain — net win.

## Verification after deploy
1. DevTools → Network: confirm `sora-700.woff2` loads from `/fonts/` in the first wave, no Google Fonts request for Sora.
2. DevTools → Performance: H1 paints with Sora on the first frame (no fallback flash).
3. Run mobile Lighthouse 2× on `https://locuslegal.lovable.app` and report median FCP / LCP / score.

## Out of scope (per your instruction)
- Inter stays on Google Fonts.
- No changes to `prefetch.ts`, Supabase code, or anything else.
