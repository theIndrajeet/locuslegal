## Why Tier 1 wasn't showing first

You have **195 Tier 1 firms with email** in the dataset, so they exist on Mail Now. The reason they were buried is the previous sort logic: it floated **every "verified" firm to the top first**, then sorted by tier inside that. Since Corrida Legal (Tier 2) is flagged `verified` and most Tier 1 firms aren't, the verified Tier 2/3 firms ended up above all Tier 1.

## Fix

In `src/pages/Directory.tsx` `sorted` useMemo, swap the comparator priority so **tier is the primary sort key** and **verified only re-orders within the same tier**:

- `default` (relevance) and `case "tier"`: `tierWeight asc → verifiedWeight desc → rating desc → name asc`
- `case "rating-desc"`: `tierWeight asc → verified desc → rating desc` (so a 5-star Tier 4 doesn't jump above Tier 1)
- `case "name-asc" / "name-desc"`: pure name sort, no verified bump (these are explicit user choices, respect them)

Result: Tier 1 firms (Luthra, Trilegal, Shardul Amarchand, S&R, Phoenix Legal, …) lead the list, then Tier 2 — and within each tier the verified ones still float to the top with the badge.

No data, schema, or other UI changes.