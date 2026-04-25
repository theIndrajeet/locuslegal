# Batch B — Structural perf wins

Two things: (1) collapse the 4 worst multi-query pages into single `SECURITY DEFINER` RPCs so each page does **1 round-trip instead of 4–6**, and (2) run a one-time bundle analysis to catch any silent bloat. No UI changes the user will see except things feeling faster.

---

## 1. Three RPCs to bundle multi-query pages

Each RPC is `STABLE SECURITY DEFINER`, returns a single `jsonb`, and respects the same RLS-equivalent rules the page enforces today (mostly "owner or public").

### a) `get_app_dashboard(p_user_id uuid) → jsonb`

**Replaces**: `src/pages/AppHome.tsx` lines 69–84 (5 parallel queries).

Returns:
```json
{
  "profile": { ...profile row... },
  "internships_count": int,
  "moots_count": int,
  "publications_count": int,
  "bar_stats": { ...bar_user_stats row or nulls... }
}
```

Caller becomes one `supabase.rpc('get_app_dashboard', { p_user_id: uid })`. Auth check inside the function: `IF auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;` — only the owner can call it (matches today's behavior, since the page is `/app` and gated to the logged-in user).

### b) `get_public_profile(p_username text) → jsonb`

**Replaces**: `src/pages/PublicProfile.tsx` lines 128–151 + 170–206 (4 queries + a separate rank query).

Returns:
```json
{
  "profile": { id, username, display_name, avatar_url, bio, college, degree, graduation_year, cgpa, subjects_of_interest, created_at, open_to_opportunities },
  "internships": [...],
  "moots": [...],
  "publications": [...],
  "bar": {
    "designation": "...",
    "total_points": int,
    "accuracy_pct": numeric,
    "current_streak": int,
    "total_attempts": int,
    "rank_position": int | null,
    "opted_out": bool
  } | null
}
```

Logic inside the function:
- Look up profile by username (`LIMIT 1`). If null, return `{}`.
- Pull internships / moots / pubs ordered as the page does today.
- Pull `bar_user_stats` + `bar_leaderboard_opt_out`.
- If `total_attempts > 0` AND `(NOT opted_out OR p_user_id = auth.uid())`, compute `rank_position` via the same `count(*) WHERE total_points > X` query.
- The "is_owner" flag stays client-side (compare `profile.id` to `useAuthSession().userId`) — keeps the RPC pure and avoids needing `auth.uid()` for permission.

This is the **biggest win on the list**: 4 sequential round-trips (profile → 3-parallel children → bar_stats → rank) collapse into 1.

### c) `get_bar_dashboard(p_user_id uuid) → jsonb`

**Replaces**: `src/pages/TheBar.tsx` lines 59–89 (3 parallel queries + sequential rank query).

Returns:
```json
{
  "stats": { ...bar_user_stats row or trainee defaults... },
  "recent": [ { id, is_correct, points_awarded, attempted_at, challenge_title, question_type } x10 ],
  "opted_out": bool,
  "overall_rank": int | null
}
```

Auth gate: `auth.uid() = p_user_id` (page is private to the logged-in user). The 8s safety timeout in `TheBar.tsx` stays — RPC fails closed, page shows defaults.

### Risk audit
- All three are `STABLE` (no writes), `SECURITY DEFINER` with `SET search_path = public`, fixed `auth.uid()` checks where needed. Standard pattern, already used by `get_profile_activity` in this project.
- No RLS bypass risk — the RPCs return only the data the user could have fetched themselves; we're just collapsing round-trips.
- `supabase/types.ts` regenerates automatically after the migration; the `.rpc()` calls will be type-safe.

### What stays untouched
- `src/pages/ApplicationTracker.tsx` only does 2 application queries (one for list, one is the same query refetched after mutation). Not worth an RPC. Skip.
- `src/components/profile/ActivityHeatmap.tsx` already uses `get_profile_activity`. Done.

---

## 2. Bundle analysis

Add `rollup-plugin-visualizer` to `vite.config.ts` (devDependency-only, gated by `--mode analyze`). One run of `bun run build -- --mode analyze` produces `dist/stats.html`. I'll open it, eyeball the top 10 chunks, and report:

- Any single page chunk > 250 KB gzipped.
- Any "common" chunk that's pulling admin-only deps (e.g. `mammoth`, `tiptap`) into pages non-admins load.
- Any duplicate library copy (different import paths importing the same package twice).

If anything looks bad, the fix is usually a `manualChunks` tweak in `vite.config.ts` or a dynamic import. I'll fix in the same pass if it's mechanical; flag for a follow-up if it's structural.

---

## Out of scope (deferred)

- Image optimization (`loading="lazy"` + WebP) — not yet the LCP bottleneck per Claude's read.
- Hover-data prefetch — premature; only worth it after measuring a specific route where chunk-load isn't the slow part.
- `useFeatureVotes` 60s cache invalidation refinement — cosmetic, optimistic UI covers it.

---

## Verification after implementation

1. `bun run build` succeeds; `supabase/types.ts` regenerates with the 3 new RPCs.
2. Click through `/app`, `/u/<your-username>`, `/the-bar`, `/u/<some-other-user>` — confirm pages render correctly with the same data as before.
3. DevTools → Network → filter `rest/v1` → confirm 1 RPC request per page instead of 4–6 table queries.
4. Bundle report saved to `dist/stats.html`; summarize findings in chat.

Approve and I'll ship the migration + the 3 page refactors + the bundle analyzer in one pass.