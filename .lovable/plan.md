## Plan: Apply unified neobrutalist X button to Sheet primitive

Update `src/components/ui/sheet.tsx` (lines 60–63) to replace the low-opacity close button with the same bold chip used in Dialog:

- 36×36 chip, 2px foreground border, hard `2px 2px 0 0` shadow
- Press-down hover (translate + shadow shrink), yellow accent on hover
- `strokeWidth={3}` X icon, `z-50` to sit above content
- Identical spacing (`right-3 top-3`) so it matches Dialog

This single change updates every side sheet across the site (FirmDrawer, StartupDrawer, MobileFilterSheet, etc.).