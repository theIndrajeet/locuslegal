## Restore channel toggle position + tier-first default sort

### 1. Move the Mail Now / Cold Call toggle back above the Bar leaderboard callout
The previous relocation (right above the search bar) felt worse. Move the channel toggle `<section>` back to its original spot — directly below the Law Firms / Startups mode toggle and **above** the `VacancyTeaserStrip`. Keep all styling and the helper caption.

### 2. Make tier-first the default ordering
Currently the default sort only lifts verified firms to the top; everything else falls back to source order. Users expect Tier 1 firms first, then Tier 2, Tier 3, Tier 4, then Individual Chambers / unknown.

Change in `src/pages/Directory.tsx`:
- Add a `tierWeight(f)` helper that returns `1` for "Tier 1", `2` for "Tier 2", `3` for "Tier 3", `4` for "Tier 4", `5` for "Individual Chamber", `6` for anything else. (Parses the trailing digit from the tier string so future tiers work.)
- In the `sorted` `useMemo`:
  - `default` (relevance) sort: `verified desc → tier asc → rating desc → name asc`. This gives Tier 1 → Tier 4 → Chambers ordering out of the box.
  - `case "tier"`: replace the broken `localeCompare` (which puts "Tier 10" before "Tier 2") with the numeric `tierWeight` comparator, with `name asc` as a tiebreaker. Verified still floats inside each tier.
- Update the Sort dropdown label from "Relevance" to "Tier (default)" so the new behaviour is discoverable, and remove the now-redundant separate "Tier" option (or keep it — they collapse to the same result).

No data, schema, or other component changes.