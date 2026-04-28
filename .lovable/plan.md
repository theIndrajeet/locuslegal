# Directory teaser on /vacancies — fill the empty side

## What you'll get

When the live-vacancies grid has empty space (e.g. only 1 or 3 live vacancies on desktop, leaving a half-row blank), I'll drop a **Directory Teaser card** into that empty slot. It's a sibling card in the same grid, so it inherits the neobrutalist treatment and never breaks the layout.

The teaser reads as a confident invitation, not a filler:

```text
┌─────────────────────────────────┐
│ [icon] DIRECTORY                │
│                                 │
│ Can't find a fit?               │
│ Search 500+ firms.              │
│                                 │
│ [ Search firms by name… ]   →  │
│                                 │
│ Popular: Tier 1 · Mumbai · IP   │
│ ──────────────────────────────  │
│ Browse the full directory  →   │
└─────────────────────────────────┘
```

- Big bold heading: **"Can't find a fit?"** with **"Search 500+ firms."** below in accent.
- A working search input — typing a firm name and pressing Enter (or tapping the arrow) navigates to `/directory?q=<query>` with the search pre-filled.
- Three clickable "Popular" chips that deep-link into pre-filtered Directory views (`/directory?tier=Tier+1`, `/directory?city=Mumbai`, `/directory?area=IP`).
- A bottom "Browse the full directory →" link for users who don't want to type.
- Card uses the same `border-2 border-foreground/80` + `shadow-[4px_4px_0_0_hsl(var(--accent))]` brutalist styling so it sits naturally next to a vacancy card.

## Where it appears

- **Desktop (md+)**: Inserted as the **last item** in the live grid only when `live.length` is odd (1, 3, 5…) — so it always lands in the otherwise-empty cell. If the grid is already full (2, 4 cards), it appears as a single full-width strip below the grid in a slimmer horizontal layout.
- **Mobile**: Always renders as a full-width card immediately after the live vacancies, before the "Recently closed" section. (The empty space the user mentioned doesn't exist on mobile — adding a teaser strip here is still useful but stays compact.)
- Hidden entirely when there are zero live vacancies (the existing empty-state already covers that case).

## Technical bits

1. New component `src/components/vacancies/DirectoryTeaser.tsx` — controlled `<input>`, `useNavigate` to `/directory?q=...&mode=firms` on submit. Two layout variants: `"cell"` (square, fits a grid cell) and `"strip"` (full-width, 2-row layout for below the grid).
2. In `src/pages/Vacancies.tsx`:
   - Compute `liveIsOdd = live.length % 2 === 1`.
   - When odd, render `<DirectoryTeaser variant="cell" />` as the final grid child.
   - When even (and `live.length > 0`), render `<DirectoryTeaser variant="strip" />` below the grid.
3. Update `src/pages/Directory.tsx` to read `?q=` on mount and seed `searchInput`/`search` (one-time effect, uses existing state — no refactor).

No DB changes, no new routes, no backend work. Pure UI + a tiny query-param read.