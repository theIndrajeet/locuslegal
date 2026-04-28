## Add iOS-style glass texture to Two-Pill Dock

Make both pills feel like translucent liquid glass — frosted blur, subtle inner highlight, soft outer glow — while keeping the neobrutalist border + hard shadow as the base identity (so it still reads as Locus, not generic iOS).

### Visual recipe (per pill)

- **Background**: `bg-background/55` + `backdrop-blur-2xl backdrop-saturate-150` so content behind shows through with a frosted tint.
- **Inner highlight**: a top inset white-glow ring (`shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18)]`) to mimic the glass meniscus.
- **Outer glow**: soft accent halo (`shadow-[0_8px_32px_-8px_hsl(var(--accent)/0.35)]`) layered with the existing hard neobrutalist shadow.
- **Border**: keep `border-2 border-foreground` but drop opacity to `border-foreground/70` so light passes through the edge.
- **Active accent pill (right)**: `bg-accent/80 backdrop-blur-xl` so the yellow becomes a translucent jelly button instead of a flat block.
- **Collapsed circle**: same glass treatment — looks like a floating liquid pill on scroll.

### Where it changes

- `src/components/dock-lab/variants/TwoPillDock.tsx` — update className strings on the left pill, right action pill, and the search sheet input row. No structural changes.

### What stays the same

- Two-pill layout, scroll-collapse logic, contextual action behavior, lab chip row.
- Neobrutalist hard shadow stays — just layered under the glass glow so the dock still has weight.

Once approved, I'll apply it to the lab variant only. The production `MobileBottomDock` swap happens in a separate step.