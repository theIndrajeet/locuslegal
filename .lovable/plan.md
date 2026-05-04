# Fix iOS Install Instructions Copy

## Problem

On iOS Safari, when a user opens the Share sheet, the **Add to Home Screen** action is no longer in the first row of actions (Copy, Add to Bookmarks, Add to Reading List). It sits behind **View More**. Our current instruction card just says "Tap [share] then Add to Home Screen" — users tap share, don't see it, and bounce.

A second smaller issue: after the install completes, iOS takes ~1–2 seconds to fetch and render the apple-touch-icon, so users briefly see a generic icon and assume our icon "didn't load."

## Scope

One file: `src/components/InstallLocusButton.tsx` — only the iOS instructions card body (lines ~191–216). Copy and small layout change only. No logic, no new components, no new assets.

## Changes

Rewrite the iOS card so it walks through the actual three-tap flow and sets expectations for the icon:

```text
Install Locus on iPhone
1. Tap [share-icon]
2. Scroll down → tap "View More"
3. Tap "Add to Home Screen"

Give it a second to load the icon.
```

Implementation notes:
- Keep the existing `bg-background border-2 border-foreground rounded-2xl shadow-[4px_4px_0_0_hsl(var(--accent))]` card chrome.
- Replace the single inline sentence with a 3-step ordered list (numbered, tight spacing, font-inter text-xs).
- Keep the `Share` icon inline in step 1 (accent color, same size as today).
- Add a small muted footnote line under the steps: "Give it a second — iPhone fetches the icon after you tap Add."
- Bump card `max-w-xs` to `max-w-[280px]` so the 3-line list doesn't wrap awkwardly on small screens (440px viewport tested).
- No copy changes to the pill button itself, the dismiss flow, the Android path, the timing (4s delay), or analytics events.

## Out of scope

- Android `beforeinstallprompt` flow.
- Icon generation / manifest (already done in previous turn).
- Detecting iOS version to conditionally show "View More" step (not worth the UA sniffing — the instruction is harmless on older iOS where it's already in row 1).
