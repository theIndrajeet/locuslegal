## Goal

Flip the Two-Pill Dock's idle behavior: when the screen is stable (no scroll/interaction), the left pill collapses to a compact pill showing the **active page icon + label**. Any scroll or tap expands it back to the full nav, then it re-collapses after a short idle period.

## Changes (single file)

**`src/components/dock-lab/variants/TwoPillDock.tsx`**

1. **Default state**: `collapsed` starts as `true` (currently `false`).
2. **Idle timer rewrite**: replace the current scroll handler with:
   - On any scroll (up or down) → `setCollapsed(false)` and reset idle timer.
   - Idle timer (≈1500ms) → `setCollapsed(true)`.
   - On mount → start idle timer so the dock collapses after first paint.
   - Tapping the collapsed pill expands it and resets the idle timer.
   - Tapping a nav item resets the idle timer (so users can navigate without it snapping shut mid-tap).
3. **Collapsed pill content**: change the collapsed view from a 48×48 icon-only square to a horizontal pill showing:
   - Active item's Lucide icon (accent color)
   - Active item's label in Sora bold, text-xs
   - Padding `px-4 py-2.5`, same rounded-full + glass styling as the expanded pill
4. **Right action pill**: keep current behavior; it already animates independently and looks correct alongside both states.

## Technical details

- Idle timer stored in a `useRef<number | null>`, cleared on unmount and on every reset.
- Use a single `resetIdle()` helper to DRY the "expand + restart timer" logic across scroll, tap-to-expand, and nav-item clicks.
- Keep the existing `LayoutGroup` + `motion.div layout` so width animates smoothly between the two states (Framer handles the morph).
- Keep `AnimatePresence mode="wait"` for the inner content swap; just replace the collapsed branch's JSX.
- No changes to `ACTION_PRESETS`, `ActionPill`, `Sheet`, or `navItems`.

## Out of scope

- Production `MobileBottomDock.tsx` is untouched — this is lab-only iteration. Once you approve the feel, we can port to the real dock in a follow-up.
