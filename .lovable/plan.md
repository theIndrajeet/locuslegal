## Install Meta Pixel (ID: 6748646345221689)

### What ships

1. **Base pixel in `index.html`** — standard Meta snippet in `<head>` initializing pixel `6748646345221689` and firing `PageView`. `<noscript>` fallback `<img>` placed in `<body>` (HTML5 rule — `<noscript>` in `<head>` may only contain metadata).
2. **SPA pageview tracker** — small `useEffect` in `src/App.tsx` that listens to React Router location changes and calls `fbq('track', 'PageView')` on every route change (Meta's base snippet only fires once on hard load; SPAs need manual re-fires).
3. **TypeScript shim** — declare `window.fbq` in `src/vite-env.d.ts` so future `fbq(...)` calls type-check cleanly.

### What does NOT ship now

- No conversion events (Lead, CompleteRegistration, etc.). We'll wire those per-campaign when you run ads — typically on waitlist submit, Bar attempt complete, vacancy click.
- No cookie banner / consent gating. Flag for later if you target EU traffic.

### Files touched

- `index.html` — add pixel snippet + noscript img
- `src/App.tsx` — add route-change PageView hook
- `src/vite-env.d.ts` — add `fbq` global type

### Verification after deploy

Install Meta's "Pixel Helper" Chrome extension, load `locus.legal`, navigate between pages — should see PageView fire on each route.

Approve and I'll ship it.
