

# Remove Mobile Header Nav Strip + Enlarge Bottom Dock Icons

## Changes

### `src/components/Navbar.tsx`
- Remove the mobile scrollable nav strip (lines 132-139) — the entire `md:hidden` chip row and fade hint
- Keep everything else (logo bar, desktop nav, mobile theme toggle)

### `src/components/MobileBottomDock.tsx`
- Increase icon size from `20` to `24`
- Increase tap target: add `w-10 h-10 flex items-center justify-center` to each Link for a bigger hit area
- Increase container padding from `px-5 py-2.5` to `px-6 py-3`
- Increase gap from `gap-5` to `gap-4` (icons are bigger so slightly tighter gap keeps it balanced)

## Files

| Action | File |
|--------|------|
| Edit | `src/components/Navbar.tsx` |
| Edit | `src/components/MobileBottomDock.tsx` |

