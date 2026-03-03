

# Enhance Waitlist Forms with Motion Animations

## What Changes

Upgrade the WaitlistSection forms with framer-motion staggered animations (inspired by the BookingForm pattern) while keeping the existing neobrutalist button style and black/white/yellow theme. The forms already match the screenshot structurally — the main improvement is adding entrance animations and refining input/card styling for polish.

## Steps

### 1. Edit `src/components/WaitlistSection.tsx`
- Import `motion` from `framer-motion`
- Wrap each form card in `motion.form` with `hidden → visible` variants (fade up + stagger children)
- Wrap each input/select/button in `motion.div` with item variants for staggered reveal
- Refine input styling: increase border radius, add subtle hover border transition
- Add `size="lg"` to submit buttons for better visual weight matching the screenshot

### Files
- **Edit:** `src/components/WaitlistSection.tsx` — add framer-motion stagger animations to form fields

No new files or dependencies needed (framer-motion already installed).

