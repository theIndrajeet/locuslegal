## Problem

On `/tour-lab`, the control bar (Welcome modal toggle, Reset, Start tour) is rendered with `sticky top-0 z-40`, but the global Navbar is `fixed top-0 z-50`. Result: the control bar sits *underneath* the navbar and the buttons visually collide with the nav links (visible in the screenshot — "Reset"/"Start tour" overlapping "Resources"/"Tools").

## Fix

In `src/pages/TourLab.tsx`, update the control bar wrapper:

- Add `mt-16` so the bar starts below the fixed navbar (navbar ≈ 64px tall).
- Change `sticky top-0 z-40` → `sticky top-16 z-30` so when it sticks while scrolling, it docks just below the navbar (not behind it).
- Wrap it as a neobrutalist floating card: `border-2 border-foreground/80 bg-card/95 backdrop-blur shadow-[4px_4px_0_0_hsl(var(--foreground))] mx-4 md:mx-6 rounded-xl` (drop the old `border-b-2` full-bleed style since it now floats).

No other files change. Demo content, tour engine, and routing stay untouched.

## Acceptance

- Open `/tour-lab` — the control bar appears as a floating card clearly below the navbar with no overlap.
- Scroll down — the bar sticks just below the navbar, not behind it.
- Start tour / Reset / toggle still work exactly as before.
