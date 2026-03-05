

## Change RainbowButton Fill to Gold/Yellow

Update `src/components/ui/rainbow-button.tsx` to replace the white/dark background gradients with gold/yellow tones.

### Change

**`src/components/ui/rainbow-button.tsx`** — Replace the background gradient lines:

- Light mode: Change `#121213` (dark/black fill) to a gold color like `hsl(45,100%,51%)` / `#FFCC00`
- Dark mode: Change `#fff` (white fill) to the same gold

This changes the solid inner fill of the button from white/black to gold while keeping the animated rainbow-gold border effect.

