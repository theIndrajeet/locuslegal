## The actual bug

Your activity data **is** loading correctly. I queried the database directly:

- Header shows "10 contributions in the last year" → correct, matches your real attempts.
- The RPC `get_profile_activity` returns activity on Apr 23, 24, 26, 28, and 30 (today).

The problem is **purely visual on mobile**.

The heatmap renders 53 weeks × 14px ≈ **742px wide** inside an `overflow-x-auto` container. Your phone viewport is **440px**. Today's activity sits on the **far right** of the grid (the last column), which is off-screen. You're only seeing the empty **left half** (May 2025 → Oct 2025), where you genuinely had no activity.

The month labels in your screenshot confirm this: "Apr · May · Jun · Jul · Aug · Sep · Oct" — those are the older months. The recent months (Nov 2025 → Apr 2026) are scrolled off-screen to the right.

## Fix

In `src/components/profile/ActivityHeatmap.tsx`:

1. Attach a `ref` to the `overflow-x-auto` scroll container.
2. After the grid renders (in a `useEffect` watching `loading`/`grid`), set `scrollLeft = scrollWidth` so the most recent week (today) is visible by default.
3. Add a subtle visual hint that the grid is horizontally scrollable on narrow screens (e.g. a faint right-edge gradient mask) so users know they can swipe.

That's it — no database, RPC, or query changes needed. The data is correct.

## Technical detail

```text
Container width:  ~440px (mobile)
Grid width:       ~742px (53 weeks × 14px)
Today's column:   rightmost (off-screen by default)
Fix:              scrollLeft = scrollWidth on mount
```

No migration, no RPC change, single-file edit.
