

## Plan: Auto-hide Mobile Dock on Scroll Idle

### What
Make the mobile bottom dock visible only while the user is actively scrolling. When scrolling stops, the dock fades out after a short delay (~1.5s). This keeps the view clean when reading static content.

### How

**File: `src/components/MobileBottomDock.tsx`**
- Add `useState` for a `visible` boolean (default `false`)
- Add `useEffect` with a `scroll` event listener on `window`
- On scroll: set `visible = true`, clear any existing timeout, set a new ~1.5s timeout to set `visible = false`
- Apply conditional classes: when not visible, translate the dock downward (`translate-y-24`) and reduce opacity to 0; when visible, restore position with a smooth transition
- Use `transition-all duration-300` for smooth show/hide animation

Single file change, ~15 lines added.

