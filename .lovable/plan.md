# Quick win: simplify the footer memory game

Drop the demo lab, kill the busy 24-card grid, ship the calmest possible memory game.

## Changes

1. **`src/components/FooterArcade.tsx`** — keep the existing flip mechanics, change two things:
   - **Card back**: replace the cluttered 4-symbol composite (asterisk + triangle + clover + trident) with a single small Locus monogram dot — yellow ring + yellow center on a dark card. Quiet, repeats cleanly, reads as one element.
   - **Grid**: shrink from 12 pairs (24 cards, 8 columns) to **8 pairs (16 cards, 4 columns)**. Win-condition counter updated from `=== 12` to `=== 8`. Mobile breakpoint stays 4 columns. Symbols trim from 12 to the 8 most distinct (triangle, circle, diamond, signal, target, home, square, lightning).

2. **Remove the demo lab** (no longer needed):
   - Delete `src/pages/ArcadeLab.tsx`
   - Delete `src/components/arcade-lab/Lockbox.tsx`
   - Delete `src/components/arcade-lab/Objection.tsx`
   - Delete `src/components/arcade-lab/StampSort.tsx`
   - Remove the `ArcadeLab` lazy import + `/arcade-lab` route from `src/App.tsx`

No memory updates needed — `mem://features/footer` already says "neobrutalist memory game" which still applies.

Approve and I'll ship it.
