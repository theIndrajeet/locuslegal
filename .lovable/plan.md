## Goal

Replace the rotating/morphing hero with a static, two-column hero that matches the bento tile language used elsewhere on the home page. No timers, no morphs, no progress bars, no flicker.

## Layout

- Left column (`lg:col-span-7`): pitch
- Right column (`lg:col-span-5`): "Receipts" stat tile
- Mobile: stacked, left content first, tile second
- Background: keep `FallingPattern` + soft yellow radial glow (toned down, anchored mid-left)

## Left column — pitch

- **Eyebrow** (mono, tracking-widest, muted, text-xs): `FOR THE 5 LAKH LAW STUDENTS INDIA IGNORES`
- **Headline** (Sora, font-semibold, text-4xl sm:text-5xl lg:text-6xl, leading-[1.05]): "Law school in India is a lottery. **We're the way out.**" — second sentence in `text-accent`
- **Subheadline** (Inter, text-base sm:text-lg, text-foreground/70, max-w-[60ch]): "26 NLUs get the firms. The other 5,00,000 get a placement cell that doesn't have a plan. Locus is the plan."
- **CTAs**:
  - Primary: `Join the waitlist` → `/waitlist` — solid yellow, black text, 2px black border, neobrutalist hover-lift shadow
  - Secondary: `Browse the directory` → `/directory` — transparent, white text, 2px white border, hover → border-accent

## Right column — "Receipts" tile (Exhibit A)

Visually a sibling of the bento tiles below.

- Container: `rounded-2xl border-2 border-foreground bg-accent text-accent-foreground p-8 shadow-[8px_8px_0_0_hsl(var(--foreground))]`
- Top row: `Scale` Lucide icon in `bg-foreground text-accent rounded-md p-2` square + `EXHIBIT A` pill stamp on the right (`bg-foreground text-accent`, mono, tracking-widest — mirrors FLAGSHIP / LOCUS+ stamps in FeatureBento)
- Hero stat: `5,00,000` — Sora, font-bold, text-6xl lg:text-7xl, leading-none, tabular-nums, black. One-shot count-up from 0 → 500000 over 1.2s on mount.
- Caption (mono, text-xs, tracking-widest, black/70): `LAW STUDENTS · INDIA · 2025`
- 2px black hairline divider
- Three support rows (mono, tabular-nums, black): `26  NLUs in India` / `3,890  firms in the Locus directory` / `1  platform built for everyone else`
- Bottom-right corner: `ArrowUpRight` link to `/directory`, black on yellow

## Animation

- Stagger fade-up on mount only (eyebrow → headline → subheadline → CTAs → tile, ~80ms steps)
- One-shot count-up on the `5,00,000` stat (1.2s, ease-out)
- Respect `prefers-reduced-motion` → static render, no count-up
- Zero loops, zero rotation, zero morph

## Files

- **Rewrite** `src/components/home/RotatingHero.tsx` — strip all rotation/morph/dot/progress/timer logic. Becomes a static section.
- **Delete** `src/components/home/HeroAngle.tsx` — no longer used
- **Keep filename** `RotatingHero.tsx` so `Index.tsx` import stays untouched
- **No changes** anywhere else (StatsBar, FeatureBento, LocusPlusStrip, AudienceMiniRow, FinalCTA, Navbar, Footer, Index)

## Out of scope

- Anything below the hero
- `/waitlist` or `/directory` pages
- The falling background pattern itself