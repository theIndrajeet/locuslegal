# Directory teaser — show the *full* directory, not just firms

## What changes

The current teaser only mentions "500+ firms". Reality: the directory also covers **startups & SMEs** (with sectors, stages, sizes, legal-team flag) plus **chambers, individual advocates, cities, practice areas, tiers**. The teaser will be redesigned to convey that breadth and let people jump into any of those slices in one tap.

## New teaser anatomy (both `cell` and `strip` variants)

```text
┌───────────────────────────────────────────┐
│ [icon] DIRECTORY                          │
│                                           │
│ Beyond this list.                         │
│ 500+ firms · 200+ startups · all India.   │
│                                           │
│ [ Firms ] [ Startups & SMEs ]   ← toggle  │
│                                           │
│ [ Search by name…              ]   →     │
│                                           │
│ Browse by:                                │
│   Tier 1   Mumbai   IP   Chambers         │  ← when "Firms"
│   Fintech  Series A  Has legal team       │  ← when "Startups"
│ ────────────────────────────────────────  │
│ Open the full directory  →               │
└───────────────────────────────────────────┘
```

Key updates:

1. **Headline rewritten** to convey breadth, not just count:
   - Line 1 (foreground): *"Beyond this list."*
   - Line 2 (accent): *"500+ firms · 200+ startups · all India."*
2. **Mode toggle** (Firms / Startups & SMEs) — neobrutalist segmented control identical to the one used inside Directory itself. Selecting a mode swaps the chip set below.
3. **Search input** posts to `/directory?q=…&mode=<firms|startups>` so the user lands inside the right tab with their query pre-applied.
4. **Dynamic chip rows**:
   - **Firms mode**: `Tier 1` → `?tier=Tier 1` · `Mumbai` → `?city=Mumbai` · `IP` → `?area=IP` · `Chambers` → `?type=Chamber`
   - **Startups mode**: `Fintech` → `?mode=startups&sSector=Fintech` · `Series A` → `?mode=startups&sStage=Series A` · `Has legal team` → `?mode=startups&sLegal=yes`
5. **Footer link** *"Open the full directory →"* always lands on `/directory?mode=<currentMode>`.

## Directory side — wire up the new params

`src/pages/Directory.tsx` already reads `?q=` and `?mode=`. I'll extend the URL-param seeding to also pre-fill (one-time on mount):

- Firms: `tier`, `city`, `area`, `type`
- Startups: `sCity`, `sSector`, `sStage`, `sSize`, `sLegal`

This means every chip in the teaser produces a real, filtered Directory view, not just a vanilla page load.

## Where it appears (unchanged)

- Desktop odd-count: fills the empty grid cell (`cell` variant).
- Desktop even-count: full-width strip below the grid (`strip` variant).
- Mobile: full-width strip below the grid.

The `strip` variant gets the same mode toggle + dynamic chips, just laid out horizontally so it doesn't grow tall.

## Technical bits

- Edit `src/components/vacancies/DirectoryTeaser.tsx`: add a `mode` local state + chip arrays per mode, swap chips and submit-target accordingly.
- Edit `src/pages/Directory.tsx`: extend the existing one-time URL-param hydration to seed all firm + startup filters from the search params on mount.
- No new files, no DB changes.