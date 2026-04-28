## Fix the dock "double pill" glitch

**Root cause:** When navigating between routes that have different contextual actions (e.g. `/app` with `Log` → `/` with `Join`), the `<AnimatePresence>` wrapping the contextual button lets the exiting and entering pills overlap on screen, producing the 4-button cram you saw (`Home + Search + Join + Log`).

A secondary issue: at 440px width the right cluster sits too close to the screen edge when both Search and a context action are visible.

### Changes — `src/components/MobileBottomDock.tsx`

1. **Add `mode="wait"` to the contextual-action `AnimatePresence`** so the old action fully exits before the new one enters. Eliminates the overlap entirely.

2. **Speed up the context-action enter/exit** (shorter spring or tween ~180ms) so `mode="wait"` doesn't feel sluggish during route changes.

3. **Tighten the right cluster gap** from `gap-2` to `gap-1.5` and reduce context-pill horizontal padding from `px-4` to `px-3.5` so the dock breathes at 440px width.

4. **Reset `contextAction` cleanly on pathname change** by keying the inner AnimatePresence on `pathname + contextAction` so React unmounts the stale button immediately when the route changes, not just when the action value changes.

No other files affected. No design-system, data, or auth changes.