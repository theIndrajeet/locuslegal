# Directory filters — one-line bar

Collapse the current 3-row filter panel (search row + type pills + active chips) into a **single horizontal bar** that matches Locus's neobrutalist style.

## The line

```text
[🔍 Search firms………] [City ▾] [Area ▾] [Tier ▾] [Type ▾] [Sort ▾] [▦|Map]
```

- One row, full container width, no surrounding card panel.
- Black `border-2`, rounded, hard yellow shadow `shadow-[4px_4px_0_0_hsl(var(--accent))]` — same language as Vacancies / The Bar.
- Search flexes to fill leftover space; everything else is fixed-width.
- Active filter count appears as a small yellow dot on the relevant dropdown trigger (no separate chips row).
- "Clear all" appears as a tiny X button at the far right, only when any filter is active.

## Behaviour

- **Dropdowns** — replaced with shadcn `Popover` + `Command` (searchable). No more native `<select>`.
- **Type filter** — moves into a "Type ▾" dropdown (was a separate pill row).
- **Sort + View toggle** — pulled into the same line (was a separate row below).
- **Active filter chips row** — removed; selection is shown inside each dropdown trigger ("City: Mumbai" instead of "City ▾").
- All existing filter logic, debounced search, URL sync, and pagination reset stay identical.

## Mobile (≤640px)

The same one line, but compacted:
```text
[🔍 Search………………]  [Filters ▾]  [▦|Map]
```
- All dropdowns + sort collapse behind one **"Filters"** button that opens a bottom `Sheet`.
- Active filter count shown as a yellow badge on the Filters button.

## Startups mode

Same one-line bar; the four dropdowns swap to Sector / Stage / Size / Legal Need.

## Files

- `src/pages/Directory.tsx` — replace the `<section>` filter block (lines ~297–408) with the new bar.
- New `src/components/directory/FilterBar.tsx` — the one-line bar (handles both modes).
- New `src/components/directory/FilterDropdown.tsx` — Popover+Command trigger.
- New `src/components/directory/MobileFilterSheet.tsx` — bottom sheet for mobile.

No data, schema, or routing changes.

Approve and I'll build it.
