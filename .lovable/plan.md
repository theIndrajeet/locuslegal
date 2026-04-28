# Fix Moots & Publications UI on CV Analyser

## What's wrong (from screenshot)

On `/app/cv-analyser` results, the **Moots** and **Publications** cards have layout issues on mobile:

1. **Publication titles get clipped mid-word** ("Navig…", "Frameworks a…") because they use `truncate` inside a one-line flex row that also has to fit a tier pill.
2. **Tier pill (PREDATORY) wraps below the title** awkwardly via `flex-wrap`, creating a stranded badge that looks like a primary label rather than metadata.
3. **Moots card sits empty next to a dense Publications card** on tablet (`md:grid-cols-2`) — and on mobile it stacks but gives the empty Moots card the same vertical weight as the populated Publications card.
4. Cards lack the neobrutalist treatment used elsewhere (hard borders, accent shadow), so they feel flat compared to the rest of the analyser.

## Fix

Rework the Moots + Publications block in `src/pages/CvAnalyser.tsx` (lines ~754–807):

### Layout
- Keep `md:grid-cols-2` on desktop, but on mobile keep stacking (already does).
- When **either** Moots or Publications is empty, render only the populated card full-width instead of a half-empty grid. If both are empty, render a single muted card.

### List item structure (per moot / publication)
Replace the current `flex flex-wrap items-center gap-2` row that competes title vs. pill:

```
┌───────────────────────────────────────────┐
│ [TIER PILL]                               │  ← pill on its own line, top
│ Full publication title, allowed to wrap   │  ← no truncate, leading-snug
│ Venue / role · outcome (muted, smaller)   │
└───────────────────────────────────────────┘
```

- Tier pill moves **above** the title (small, uppercase, neobrutalist border) so it reads as a label, not a trailing afterthought.
- Title: remove `truncate`, allow wrapping, `font-heading text-sm font-semibold leading-snug break-words`.
- Meta line: keep muted, `text-xs`.
- Item container: bump from `border` to `border-2 border-foreground/15 rounded-xl p-3 bg-card` for clearer separation, and add a subtle `hover:border-accent/40` since these are not interactive but match analyser language.

### Card styling
- Headers: keep Trophy/BookOpen + accent icon, but increase title to `text-sm` uppercase tracking to match the analyser's section style.
- Empty state: keep italic muted copy, but center it vertically with `py-6` so the empty card doesn't look broken.

### Pill component touch-up
`PubTierPill` "Predatory" currently uses `bg-destructive/10` — keep semantics but add `font-mono` to match the rest of the analyser's metadata pills.

## Files changed
- `src/pages/CvAnalyser.tsx` — rewrite the Moots + Publications grid block (~lines 754–807) and tweak `PubTierPill` / `MootTierPill` font.

No new components, no data changes, no migrations.
