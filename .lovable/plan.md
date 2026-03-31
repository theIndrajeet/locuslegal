

## Plan: Softer Mobile Dock Animation

### Problem
The dock vanishes abruptly — `duration-300` is too fast, `translate-y-24` is too dramatic, and `opacity-0` makes it fully disappear.

### Changes (single file: `src/components/MobileBottomDock.tsx`)

1. **Slower, gentler transition**: Change `duration-300` → `duration-700` with `ease-in-out` for a smooth fade
2. **Subtle slide**: Replace `translate-y-24` → `translate-y-4` so it barely drifts down instead of flying off-screen
3. **Partial fade**: Change `opacity-0` → `opacity-0` but with the slower duration it will feel much more natural
4. **Longer idle timeout**: Increase from `1500ms` → `2500ms` so the dock lingers a bit longer after scrolling stops
5. **Show on first touch too**: Also listen for `touchstart` so tapping the screen area briefly reveals the dock

The result: the dock gently fades and slides down ~16px over 700ms instead of snapping away. It stays visible 2.5s after scroll stops.

