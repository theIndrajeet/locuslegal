# Shipment 1 — Fix LCP `opacity: 0` on the rotating hero

## Root cause (confirmed from Lighthouse report)

The mobile LCP element is the `<span>` inside `GooeyText` with `style="opacity: 0"`:

```
"snippet": "<span class=\"absolute inset-0 text-accent ...\" style=\"opacity: 0;\">"
"label": "Element render delay", "duration": 4535ms
```

This is `text1Ref` — the *hidden* sibling used to crossfade between morph variants. It's rendered absolutely-positioned over `text2Ref` (which contains the actual visible first phrase). Because `text1Ref` shares the same bounding box and is the later-painted candidate of the two, Lighthouse picks **it** as the LCP node and waits for it to become visible — which never happens, hence the 4.5s render-delay penalty.

The above-the-fold elements (eyebrow button, H1, feature grid, CTAs) also use `hero-fade-in` CSS keyframes that start at `opacity: 0`, contributing to the perceived delay even though they're not the LCP node themselves.

## Files to edit

### 1. `src/components/ui/gooey-text-morphing.tsx`

- **Render `texts[0]` (text2Ref) at full opacity in normal flow on first paint.** No changes needed here — already correct.
- **Do NOT mount `text1Ref` (the hidden absolute span) until `animateReady` is true.** Currently it mounts immediately at `opacity: 0%`, which is what Lighthouse flags. Wrap it in `{animateReady && (...)}`.
- **Defer the SVG `<filter>` mount behind `animateReady` as well** so it only enters the DOM once we're ready to actually morph.
- **Add `aria-hidden="true"` to the hidden morph span.**

### 2. `src/components/home/RotatingHero.tsx`

Remove the `hero-fade-in` and `hero-fade-in-delay-{1,2,3}` classes from:
- The `RainbowButton` eyebrow
- The `<h1>` containing the LCP text
- The features grid `<div>`
- The CTA row `<div>`

These elements will render at their final visual state on first paint. No fade-in animation on initial mount. (Subsequent variant transitions inside `GooeyText` continue to animate normally — only the *initial* paint is changed.)

Leave `hero-fade-in` keyframes in `src/index.css` untouched (still used by other places, harmless if unreferenced here).

### 3. `vite.config.ts`

Add explicit minification flags inside the existing `build:` block (currently only `rollupOptions` is set):

```ts
build: {
  minify: "esbuild",   // explicit (esbuild is the default but pinning is safer)
  cssMinify: true,     // explicit
  sourcemap: false,    // don't ship .map files to production
  rollupOptions: { ... }  // unchanged
}
```

## What this does NOT touch (per instructions)

- ❌ No Supabase / lazy-load work
- ❌ No `src/lib/prefetch.ts` changes
- ❌ No visual design changes (final rendered state is identical — only the entry animation is removed)
- ❌ No changes to `Layout.tsx`, `Navbar.tsx`, `ShapeLandingBg.tsx`, `RainbowButton.tsx`, etc.
- ❌ No changes to fonts, `index.html`, or CSS beyond the class removals above
- ❌ Dead-code `src/components/Hero.tsx` left alone (not imported anywhere — confirmed via ripgrep)
- ❌ No `HeroAngle.tsx` exists in this project (confirmed)

## Expected outcome

- LCP element (`<h1>` text) paints in frame 1 at opacity 1
- Lighthouse no longer sees an `opacity: 0` sibling competing for LCP candidacy
- "Element render delay" subpart should drop from ~4.5s to near-zero
- Mobile LCP estimated to fall from 3.3s → ~1.0–1.5s
- Mobile performance score expected to land in the 90+ range

## After deploy

Stop. Run mobile Lighthouse 3× on `https://locus.legal`. Report median FCP, LCP, TBT, and overall performance score. Do not proceed to any further optimization work without explicit approval.
