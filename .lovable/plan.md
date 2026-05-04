
# Plan: In-app "Install Locus" button (fluid, non-overlapping, visible close)

A floating install pill that triggers Chrome's native install prompt on Android, falls back to "Add to Home Screen" instructions on iOS, and stays out of the way of the existing mobile dock.

## Behavior

- **Android / desktop Chromium**: captures `beforeinstallprompt`, then a tap calls `event.prompt()` (native install dialog).
- **iOS Safari** (no install API): after a 4s delay, the pill appears; tapping it opens a small instructions card pointing to Share → Add to Home Screen.
- **Already installed** (`display-mode: standalone` or iOS `navigator.standalone`): never shows.
- **Dismiss**: explicit close (X) chip stores a 7-day cooldown in `localStorage` (`locus_install_dismissed_at`). Same cooldown applied if user dismisses the native Chrome dialog.
- **Auto-hide on `appinstalled`**: pill disappears immediately after install completes.
- **Mobile-only**: `md:hidden`. Desktop chrome stays untouched.

## Layout — fluid, non-overlapping, visible close

The mobile dock sits at `bottom-5` (~20px) and is ~48px tall, so anything in the bottom ~80px would collide.

- **Position**: `fixed bottom-24 inset-x-0` (96px from bottom) — clears the dock with breathing room on every supported viewport (320px → 414px wide).
- **Container**: `flex justify-center px-4 pointer-events-none` — pill stays centered, never wider than the screen, and the wrapper itself doesn't block taps; only the pill itself receives pointer events.
- **Pill width**: `max-w-[calc(100vw-2rem)]` so on the narrowest devices (320px) it can never overflow, and the label uses `truncate` as a safety net.
- **Hidden when CompareBar is active** (same condition as dock) — checked via `data-compare-bar="true"` so we don't stack two floating UI elements.
- **Hidden when an input is focused** (mobile keyboard up) — listens to `focusin` / `focusout` on form fields outside the pill, mirrors dock behavior.
- **Auto-fade on scroll-down, return on scroll-up** — same pattern as the dock so the two move in concert.

### Close button (X) — clearly visible, real button, not hidden

- A dedicated 28×28 px chip on the right edge of the pill: `bg-foreground/15` over the yellow accent → high contrast against `bg-accent`, with `aria-label="Dismiss install prompt"`.
- Rendered as a real `<button>` (not a nested `<span role="button">`) inside the outer button — using a `<div>`-rooted pill so the X can be a sibling button without nested-interactive-element warnings.
- Hover/active: shifts to `bg-foreground/25` so the affordance is obvious.
- 44×44 hit area via `before:absolute before:inset-[-8px]` so thumbs never miss it.

## Style (neobrutalist, brand-correct)

- Yellow `bg-accent` pill, 2px `border-foreground`, hard `3px 3px 0 0 hsl(var(--foreground))` shadow.
- Sora bold uppercase label "INSTALL LOC**us**" — trailing "us" at 70% opacity (the dedicated `text-accent` reservation already covers the brand mark elsewhere; here we keep it monochrome inside the yellow chip).
- `Download` icon (Lucide) on the left, `X` chip on the right.
- Active state on the main pill: shifts 1px right/down, shrinks shadow to `1px 1px 0` — standard neo-brutal press.
- Zero emojis. All icons from Lucide.
- Animations via `framer-motion` with the project's standard ease `[0.22, 1, 0.36, 1]` and 0.28s duration — matches the dock.

## Files

### 1. `src/components/InstallLocusButton.tsx` (new)

Self-contained component:
- Type shim for `BeforeInstallPromptEvent` (not in standard `lib.dom`).
- Helpers: `isStandalone()`, `isIOS()`, `recentlyDismissed()`.
- Effects:
  - Add `beforeinstallprompt` listener (Android path).
  - Add `appinstalled` listener (auto-hide).
  - On iOS, schedule a 4s delay to show the iOS-hint variant.
  - Watch `[data-compare-bar="true"]` via `MutationObserver` (mirrors dock).
  - Watch `focusin`/`focusout` for keyboard avoidance.
  - Watch scroll direction for fade.
- Renders a `<div>` wrapper containing the main pill (Download + label) and a sibling `<button>` X chip — both as discrete buttons, no nesting.
- Tap on main pill: `prompt()` on Android, toggle the iOS hint card on iOS.
- Tap on X: stops propagation, writes cooldown, hides everything.

### 2. `src/components/Layout.tsx` (1 line + lazy import)

Lazy mount alongside `MobileBottomDock`:

```tsx
const InstallLocusButton = lazy(() => import("./InstallLocusButton"));
```

Inside the existing `<Suspense fallback={null}>`:

```tsx
<MobileBottomDock />
<InstallLocusButton />
```

### 3. Memory note

Append to `mem://features/installable-pwa`: component path, trigger logic, 7-day dismiss cooldown, layout collision rules (above dock, hidden with CompareBar, fade with keyboard/scroll).

## Out of scope

- No `/install` marketing page (can add later).
- No analytics event hook (drop-in `console.log` later if needed).
- No desktop variant (lift `md:hidden` later if desired).

## Verification

- Android Chrome on `locus.legal`: pill appears once Chrome's installability heuristics fire → tap → native dialog → installed → pill auto-hides.
- iOS Safari on `locus.legal`: pill appears after 4s → tap → instruction card with Share + Add-to-Home-Screen icons.
- Already installed: launch from home screen → pill never shows.
- Dismiss via X: pill hides, doesn't return for 7 days even on hard reload.
- 320px viewport: pill stays inside the screen, X is fully visible and tappable, no overlap with dock at any scroll position.
- Open any input on a page → pill fades out with the dock; close keyboard → both return.
- Routes with CompareBar (Directory firms compare): pill is hidden alongside the dock.

## Important caveat

`beforeinstallprompt` only fires when Chrome's installability criteria are met (manifest valid, HTTPS, sufficient engagement). It will **not** fire inside the Lovable preview iframe — testing must be done on the published `locus.legal` site, ideally on a real Android device. The iOS hint variant always shows on iOS regardless.
