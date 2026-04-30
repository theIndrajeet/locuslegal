## Move Mail Now / Cold Call toggle next to the search bar

The channel toggle (Mail Now · 885 / Cold Call · 2,768) currently sits in its own section high up on `/directory`, far above the search input. Move it so it sits **directly above the search bar / Filters row**, where it acts as a clear scope switch for the results below.

### Change
- `src/pages/Directory.tsx`
  - Remove the standalone channel toggle `<section>` (currently between the Law Firms / Startups switch and the Bar leaderboard callout).
  - Re-insert the same toggle (plus its helper caption: "Firms with a public email…" / "Phone-only firms…") inside the existing `mode === "firms"` block, immediately **above** the `<FilterBar … searchPlaceholder="Search by firm name…" />`.
  - Keep the existing neobrutalist styling (border-2, hard shadow, accent fill on active tab) and the count chips. No logic, state, or data changes.

Result: search bar, channel toggle, and filters all live as one cohesive control cluster, matching the user's screenshot intent.