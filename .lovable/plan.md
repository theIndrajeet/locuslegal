
# Plan: Installable Locus (Manifest-only PWA)

Goal: Let users add Locus to their home screen on iOS and Android, where it opens fullscreen with the Locus icon — no browser chrome, no offline caching, no service worker.

## What this gets you
- "Add to Home Screen" (iOS Safari) / "Install app" (Android Chrome) prompts work
- Launches in standalone mode with proper splash + icon + brand colors
- Zero risk to the Lovable preview/editor (no service worker = no stale cache issues)
- Works on the published site (`locus.legal`) immediately after deploy

## What this does NOT do
- No offline support (no service worker by design — that's Option B)
- No background sync, no push notifications

## Changes

### 1. Create `public/manifest.webmanifest`
Brand-correct (Black bg, Yellow theme accent, Sora-style identity):
```json
{
  "name": "Locus — Merit-Based Legal Internships",
  "short_name": "Locus",
  "description": "India's legal internship platform that connects law students with firms based on merit, not college name.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

### 2. Generate the icon set
Render Locus icons (Black bg, Yellow `Lo` mark) into `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512 with safe-zone padding for Android adaptive icons)

Generated programmatically via ImageMagick from a brand SVG (Black `#000000` square, Yellow `#FACC15` "Lo" centered in Sora-equivalent weight). Existing `apple-touch-icon.png` (180×180) is reused as-is.

### 3. Update `index.html`
- Add `<link rel="manifest" href="/manifest.webmanifest" />`
- Change `<meta name="theme-color" content="#1a1a2e">` → `<meta name="theme-color" content="#000000">` (matches brand Black, replaces stale indigo)
- Add iOS standalone hints:
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="apple-mobile-web-app-title" content="Locus">`

### 4. Memory note
Save `mem://features/installable-pwa` documenting: manifest-only setup, icon paths, no SW by design, where to update if branding changes.

## Out of scope
- No `vite-plugin-pwa`, no service worker, no offline caching
- No install-prompt UI component (browsers surface their native prompt; can add a `/install` page later if desired)
- No changes to existing routes, components, or Cloud config

## Verification after deploy
- iOS Safari: Share → Add to Home Screen → opens standalone with Black splash + Locus icon
- Android Chrome: install banner / menu → Install app → launches in standalone
- Lighthouse PWA audit on published URL: "Installable" passes (offline checks will be N/A — expected)
