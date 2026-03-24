

# Footer Arcade — Locus Theme

## Summary

Port the memory card game into a React component, recolored to match the Locus brand: black background, white/light text, and yellow (`hsl(45, 100%, 51%)`) accent instead of terracotta.

## Color Mapping

| Original | Locus Theme |
|----------|-------------|
| `#1a1916` (bg) | `hsl(0,0%,3%)` (site `--background` dark) |
| `#e8ddd1` (card-back, text) | `#fafafa` (white) |
| `#b96848` (card-front, accent) | `hsl(45,100%,51%)` / `#FFCC02` (yellow accent) |
| `#a35a3a` (hover) | `hsl(40,100%,45%)` (darker yellow) |
| `#7a7060` (muted) | `hsl(0,0%,40%)` (muted-foreground) |
| SVG stroke `#1a1916` | `#000` on yellow front, `#000` on white back |
| Eye highlight `#b96848` | `#FFCC02` (yellow) |
| Flower petals `#b96848` | `#FFCC02` (yellow) |

Fonts: Use existing `Sora` for heading and `Inter`/monospace for moves counter — no new Google Font imports needed, keeping it consistent with the site.

## Changes

### 1. Create `src/components/FooterArcade.tsx`

Full React port of the game:
- State: `cards`, `flipped` (indices), `matched` (set), `moves`, `locked`, `wrongPair`
- All 12 SVG symbols + back pattern as string constants, with colors swapped to black strokes on yellow fronts, black strokes on white backs, yellow petals/highlights
- CSS via a `<style>` tag injected in the component with Locus colors
- Grid: 8 cols desktop, 6 cols mobile
- Win overlay with site-consistent styling
- `dangerouslySetInnerHTML` for SVG rendering (same pattern as source)

### 2. Edit `src/components/Footer.tsx`

- Import and render `<FooterArcade />` above the branding section
- Add a gradient separator between arcade and branding

## Files

| Action | File |
|--------|------|
| Create | `src/components/FooterArcade.tsx` |
| Edit | `src/components/Footer.tsx` |

