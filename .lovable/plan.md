# Fix the Home glitch on mobile dock too

## What the recording shows

The video is from the published site (`locus.legal`) on mobile. Sequence:
1. Dashboard at `/app`.
2. User taps the **Home** icon in the bottom mobile dock.
3. Marketing page renders fully ("Get the internship you deserve…", waitlist buttons).
4. Brief blank/skeleton state.
5. Dashboard renders.

So the glitch is still present on mobile.

## Why my last fix didn't cover this

The previous fix retargeted the **desktop Navbar** "Home" link (and the brand logo) to `/app` when the user is logged in, plus added `/app` chunk prefetch in `Index.tsx`. That works for desktop and for any redirect-from-`/` flow.

But the mobile bottom dock (`src/components/MobileBottomDock.tsx`) — which is what the user actually taps on phones — still hardcodes Home → `/`:

```ts
const ALL_NAV: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  ...
];
```

So mobile users tapping Home still hit `/`, see the marketing flash, then get redirected to `/app` after the deferred auth check fires. Same triple-state glitch.

## Fix

Make the dock auth-aware too. The dock is already lazy-loaded (`Layout.tsx` wraps it in `Suspense`), so importing `useAuthSession` here is free for the home critical bundle.

### Change 1 — `src/components/MobileBottomDock.tsx`
1. Import `useAuthSession`.
2. Inside the component, read `userId` from the hook.
3. Replace the hardcoded `ALL_NAV` Home entry with a derived list where the Home item's `to` is `/app` when `userId` is truthy, else `/`.
4. Update `getActiveKey` so `/app` matches the Home pill (so the Home icon stays highlighted on the dashboard for logged-in users — it currently matches `/` only).
5. Prefetch `/app` once we know the user is logged in (mirrors the Navbar fix).

### Change 2 — verify no regressions
- `getContextAction` already handles `/app` (returns `"log"`), so the contextual "+ Log" pill still appears on the dashboard. No change needed there.
- The `pathname === "/"` checks for hiding the dock and computing `scrolledPastHero` are still correct because anonymous users on `/` are unaffected.

## Result

Logged-in mobile user taps Home in the dock → goes directly to `/app`, dashboard chunk already prefetched, no marketing flash, no skeleton.

Anonymous mobile user taps Home → still goes to `/`, no behavior change.

## Files to edit
- `src/components/MobileBottomDock.tsx` — auth-aware Home target + prefetch + active-key match for `/app`.

## Important note about the recording

The video was recorded on `locus.legal` (the published site). My previous fix is in the **preview** build only. **The published site will continue to show the glitch until you click Publish to push the latest preview live.** After this dock fix, both the desktop and mobile flows will be glitch-free in the preview, then publishing rolls it out to `locus.legal`.