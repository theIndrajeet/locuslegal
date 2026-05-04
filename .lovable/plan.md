## What's wrong

The "Marked as open to opportunities" notice in the screenshot is a **sonner toast** (fired from `src/components/app/IdentityRow.tsx:41` when the user toggles their Open/Closed badge). Two problems:

1. **It sits at the bottom** of the screen, where it overlaps the mobile dock and the Applications card — feels like part of the page rather than a notification. Sonner's default position is `bottom-right`, but on narrow mobile viewports it stretches across the bottom.
2. **It lingers** because the global Toaster has no explicit `duration` — it inherits sonner's 4s default, which on mobile (where the user keeps the screen still) reads as "stuck there forever".

This affects every toast across the app (`shareOrCopy` confirmations, save confirmations, error toasts, etc.) — they're all in the wrong spot.

## The fix

One file: `src/components/ui/sonner.tsx`.

- Add `position="top-center"` to the global `<Toaster>` so every toast appears centered at the top of the viewport, well clear of the mobile dock.
- Add `duration={3000}` so toasts auto-dismiss after 3 seconds (was implicit 4s).
- Keep all existing class styling intact.

That's it — every toast site (IdentityRow, share buttons, profile saves, etc.) automatically gets the new position and duration. No per-call changes needed.

### Out of scope

- Replacing the toast with an inline pill on IdentityRow — the toast pattern is correct, it's just positioned badly.
- Changing the `toast.success(...)` copy in IdentityRow.
- Touching the legacy `<Toaster />` from `@/components/ui/toaster` (shadcn radix toaster) — it's not the one rendering this message; sonner is.

### File touched

- `src/components/ui/sonner.tsx` — add `position` and `duration` props.
