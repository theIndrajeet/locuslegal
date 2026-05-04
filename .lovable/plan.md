# Replace App Icons With the New Locus Mark

The home screen currently shows a generic "L" because the PWA icons in `/public/icons/` and the favicon are old placeholders that don't match the brand. The uploaded image (`31ABD606-D769-4537-8A44-058DA9E1435C.png`) is the proper Locus mark — yellow ring, "Loc" in white, "us" in yellow, accent underline, on pure black. We'll use it everywhere.

## What gets replaced

All of these surfaces currently render the wrong/placeholder mark:

1. **iOS home screen icon** (`/apple-touch-icon.png`, 180×180) — what your screenshot shows.
2. **PWA installed icon** (`/icons/icon-192.png`, `/icons/icon-512.png`) — used when installed from Android/desktop.
3. **PWA maskable icon** (`/icons/icon-maskable-512.png`) — Android adaptive icon (needs safe-zone padding so the ring doesn't get cropped by circular/squircle masks).
4. **Browser tab favicon** (`/favicon.svg`) — currently a navy square with a serif "L"; will be replaced with a PNG of the new mark + a 32×32 ICO fallback.
5. **PWA manifest** (`/public/manifest.webmanifest`) — already references the right paths; just needs cache-busting.

## How we'll do it (technical)

1. Copy the uploaded PNG to `/tmp/locus-source.png`.
2. Use Python + Pillow to generate every required size from that single source:
   - `apple-touch-icon.png` → 180×180, square (iOS adds its own rounded mask).
   - `icons/icon-192.png` → 192×192, "any" purpose, full-bleed.
   - `icons/icon-512.png` → 512×512, "any" purpose, full-bleed.
   - `icons/icon-maskable-512.png` → 512×512 with the logo composited inside the inner ~80% safe zone on a black background, so Android's mask never clips the yellow ring.
   - `favicon-32.png` → 32×32, plus a multi-resolution `favicon.ico` (16/32/48) for legacy browsers.
   - `favicon.png` → 192×192, used as the modern PNG favicon.
3. QA every generated file by previewing it before delivery.
4. Update `index.html`:
   - Drop the SVG favicon line; add `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=2">` and a `.ico` fallback.
   - Add `?v=2` cache-bust to the apple-touch-icon link so iOS re-fetches.
5. Update `manifest.webmanifest`:
   - Append `?v=2` to each icon `src` so installed PWAs pick up the new art on next visit.
   - Remove the now-unused `favicon.svg` reference path (the file itself can be deleted from `/public/`).
6. Delete the old `/public/favicon.svg` (it's no longer referenced and is off-brand).

## What you'll see after

- Browser tab: the black/yellow Locus ring instead of a navy "L".
- Add to Home Screen on iOS: the proper circular mark (iOS will round the square; the ring already lives well inside the safe area).
- Install on Android/desktop: same mark, with the maskable variant safe under any adaptive shape.

## Out of scope

- No changes to in-app logo components (`Logo.tsx`, navbar wordmark) — those already render the correct "Loc**us**" wordmark.
- No splash screens (iOS PWA splash images) — can add as a follow-up if you want the launch screen branded too.
- No changes to OG/Twitter share images.