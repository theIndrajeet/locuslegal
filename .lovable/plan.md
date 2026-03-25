

# Add Floating Bottom Dock (Mobile) — No Emojis, Lucide Icons Only

## Summary

Add a floating bottom dock on mobile with Lucide icons for thumb-friendly navigation. Complements the existing top scrollable strip. Zero emojis anywhere.

## Design

```text
│         ... page content ...         │
│                                      │
│    ┌─────────────────────────────┐    │
│    │  H   D   B   L   W   Wi    │    │  ← Lucide icons in a glass pill
│    └─────────────────────────────┘    │
│              (bottom)                │
```

- **Shape**: Rounded-full pill, fixed ~20px from bottom, centered
- **Background**: Glassmorphic — `bg-background/60 backdrop-blur-xl`, subtle border
- **Shadow**: Soft ambient `shadow-xl shadow-black/20`
- **Icons (Lucide only)**: `Home`, `Building2`, `BookOpen`, `Library`, `Wrench`, `Wine`
- **Active**: Accent color + small dot indicator below icon
- **Inactive**: Muted color, `active:scale-90` on tap
- **Tools icon**: Tiny pulse dot overlay
- **No labels**: Icons only, compact
- **Entrance**: Slide-up animation on mount
- **Visibility**: `md:hidden`

## Changes

### Create `src/components/MobileBottomDock.tsx`
- 6 icon buttons mapped to nav routes
- Active detection via `useLocation()`
- Glassmorphic fixed-bottom pill container
- Slide-up entrance animation

### Edit `src/components/Layout.tsx`
- Import and render `<MobileBottomDock />`

### Edit `src/index.css`
- Add `@keyframes slide-up-dock` animation

### Update `.lovable/plan.md`
- Remove emoji from ASCII diagram, update plan to include bottom dock

## Files

| Action | File |
|--------|------|
| Create | `src/components/MobileBottomDock.tsx` |
| Edit   | `src/components/Layout.tsx` |
| Edit   | `src/index.css` |
| Edit   | `.lovable/plan.md` |

