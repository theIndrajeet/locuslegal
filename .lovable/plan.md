## Premium-up the Directory firm cards

The "before" screenshot showed three problems in the card top-right corner:
1. Empty Compare box looks like a missing checkbox sitting next to the share icon.
2. Rating "5" pill crashes into the title row, fighting the share/compare cluster.
3. Title gets squeezed → long firm names truncate prematurely.

### The fix (one file: `src/pages/Directory.tsx`, firm card block)

- **Top-right cluster:** Share icon stays always visible. Compare box becomes invisible by default and **fades in on card hover** OR when the user already has at least one item in the compare list (so an active session never has hidden controls). When the firm itself is in the compare list, the box stays solid yellow.
- **Title row:** drop the rating pill from this row; title gets the full card width minus a small `pr-10` gutter for the share button. Two-line firm names now breathe.
- **Rating moves into the chip row** (right next to Tier 1 / Law Firm / Verified) as a clean inline marker — `★ 5` in accent yellow, pushed right with `ml-auto`. No pill background, just star + number, so it reads as metadata rather than a competing badge.

### Out of scope

- Startup cards already have a clean corner (just share icon) — no change needed.
- CompareBar component itself.
- FirmDrawer rating display.

### File touched

- `src/pages/Directory.tsx` — firm card top section only (~lines 451–501).
