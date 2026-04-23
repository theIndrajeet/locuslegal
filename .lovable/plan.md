

# The Bar — Leaderboards & Profile Integration (Prompt 4)

Closes the flywheel: rank becomes visible publicly, leaderboards create competitive pressure, firms get a discovery hook. Final prompt of the Bar build.

## Schema migration

One migration:

- **`profiles`**: add `bar_leaderboard_opt_out boolean NOT NULL DEFAULT false`.
- **New table `bar_user_colleges`**: `user_id uuid PK REFERENCES profiles ON DELETE CASCADE`, `college_normalized text NOT NULL`, `college_display text NOT NULL`, `updated_at timestamptz`. Index on `college_normalized`. RLS: public SELECT, no user writes.
- **Trigger `profiles_sync_college`** on AFTER INSERT/UPDATE OF college on `profiles`: normalize (lowercase, trim, collapse whitespace via `regexp_replace(trim(lower(...)), '\s+', ' ', 'g')`); if non-empty → upsert `bar_user_colleges`; if null/empty → delete row. SECURITY DEFINER, search_path=public.
- **Backfill**: insert one row per existing profile with non-empty college.
- **View `bar_weekly_stats`**: aggregates `bar_attempts` since `date_trunc('week', now() AT TIME ZONE 'UTC')` (Postgres week starts Monday) → `weekly_points`, `weekly_attempts`, `weekly_correct`, `weekly_accuracy_pct`. GRANT SELECT to authenticated.

## Leaderboard page

**`src/pages/TheBarLeaderboard.tsx`** (new) — public, no auth required.

- Hero "Leaderboard" / "Who's lawyering hardest right now."
- Shadcn Tabs (4): All-Time, This Week, By Area, By College. Tab + filters URL-backed via `useSearchParams` (`?tab=`, `?area=`, `?college=`).
- Per-tab queries exactly as specified in the PRD, all filtered with `bar_leaderboard_opt_out = false` and `total_attempts > 0`, capped at 500 rows, paginated 50/page.
- Dropdowns:
  - By Area: shadcn Select of all 17 areas (from existing constants).
  - By College: query distinct `bar_user_colleges` grouped + counted, top 100, label `"NLSIU Bangalore (12)"`.
- Empty states per spec for each tab.
- "You are here" logic: if logged-in user is in the result set, highlight row with accent border + "You" chip. If outside current page, sticky footer "You're ranked #N — jump to your row" → paginates + scrolls. If user has zero attempts, show pinned banner at top "You: unranked — take your first challenge" with CTA.
- `usePageMeta` title `"Leaderboard · Locus"`.

**`src/components/bar/LeaderboardTable.tsx`** (new): shared table shell. Columns: Rank, Student, Designation, Points, Accuracy, Streak. Top 3 ranks get gold/silver/bronze accent on the rank cell (within b/w/yellow palette — yellow for #1, white-on-darker for #2/#3). Mobile: collapses to a card stack (rank chip + avatar + designation + points; accuracy/streak demoted to a small row).

**`src/components/bar/LeaderboardRow.tsx`** (new): single row/card. Avatar + display_name + `@username` link → `/u/:username`. Designation badge (outline). Points bold right-aligned. Accuracy `xx.x%`. Streak with Lucide `Flame` if ≥7. "You" chip if `userId === currentUserId`. Pagination via shadcn `Pagination`.

## Public profile rank badge

**`src/components/bar/RankBadgeBlock.tsx`** (new): compact card (~140–180px), `border-2 border-border`. Lucide `Scale` + "The Bar" header. Designation bold; points; accuracy. Conditional rank line: `"Ranked #N overall"` linked to `/the-bar/leaderboard?tab=all-time` with anchor; hidden if subject opted out AND viewer ≠ subject. Streak line with Lucide `Flame` if `current_streak >= 3`. Bottom "View attempts" link (currently to leaderboard with anchor).

**`src/pages/PublicProfile.tsx`** (modify): add isolated parallel fetch for `bar_user_stats` for profile id; if exists AND `total_attempts > 0`, also run rank query `SELECT count(*) + 1 FROM bar_user_stats WHERE total_points > $points AND bar_leaderboard_opt_out = false` (skip rank query when subject opted out and viewer ≠ subject). Render `<RankBadgeBlock />` between academic block and subjects of interest. Wrap in try/catch — failure must not block profile render. Hide entirely if no row or zero attempts.

## Profile edit opt-out

**`src/components/profile/BarPrivacySection.tsx`** (new): Card "The Bar". Single shadcn Checkbox "Show me on Bar leaderboards" (inverted: checked → `opt_out=false`). Helper text per PRD. Save button writes `profiles.bar_leaderboard_opt_out` via `.upsert`. Loads current value on mount.

**`src/pages/ProfileEdit.tsx`** (modify): include `bar_leaderboard_opt_out` in initial fetch; render `<BarPrivacySection />` below CV section, above any password change area.

## Dashboard updates

**`src/pages/TheBar.tsx`** (modify):
- Quick-action block: add third button "View Leaderboard" → `/the-bar/leaderboard` (Lucide `Trophy`, outline variant — primary stays "Take a Challenge").
- Stats strip: when `total_attempts > 0`, render below the streak card a small "You're #N overall" pill linking to leaderboard. Computed via `SELECT count(*) + 1 FROM bar_user_stats WHERE total_points > $myPoints AND bar_leaderboard_opt_out = false`. If user is opted out, show "You're #N overall (hidden from public)" so they still see their position.

## Directory stub

**`src/pages/Directory.tsx`** (modify): add a small callout card (sidebar or beneath the firm grid, whichever fits the existing layout cleanly): "Looking for students? Check out the Bar leaderboard →" + one-line "Students ranked by legal skill, not just college." Links to `/the-bar/leaderboard`.

## Routing

**`src/App.tsx`** (modify): add `/the-bar/leaderboard → TheBarLeaderboard` inside existing `<Layout>` block.

## Security checklist

- All 4 leaderboard queries explicitly filter `p.bar_leaderboard_opt_out = false`.
- Profile rank number hidden from other viewers if subject opted out; always visible to the subject themselves (`auth.uid() === profile.id` check).
- `bar_user_colleges` contains no data not already in `profiles`; public SELECT is safe.
- All queries `LIMIT`-capped (500 / 100). No new edge functions = no new attack surface.
- Trigger is SECURITY DEFINER with `search_path=public`.
- Defensive: rank-badge fetch wrapped so its failure cannot break `/u/:username`.

## Performance notes

- Add btree index on `bar_user_stats(total_points DESC, last_attempt_at ASC)` if not already present (verify in migration; only create when missing).
- Add btree index on `bar_user_stats_by_area(area_of_law, total_points DESC)` if not already present.
- `bar_user_colleges.college_normalized` indexed.
- Weekly view scans `bar_attempts` within 7 days; acceptable at v1 scale; flagged for materialization later.

## Files

**New**
- `supabase/migrations/<ts>_bar_leaderboards.sql`
- `src/pages/TheBarLeaderboard.tsx`
- `src/components/bar/LeaderboardTable.tsx`
- `src/components/bar/LeaderboardRow.tsx`
- `src/components/bar/RankBadgeBlock.tsx`
- `src/components/profile/BarPrivacySection.tsx`

**Modified**
- `src/pages/PublicProfile.tsx`
- `src/pages/ProfileEdit.tsx`
- `src/pages/TheBar.tsx`
- `src/pages/Directory.tsx`
- `src/App.tsx`

## Out of scope
Student directory, firm accounts, notifications, historical rank graphs, monthly leaderboards, achievement badges beyond designations, CSV export, admin moderation tools.

## Definition of Done
Migration applied (opt-out column + colleges table + trigger + backfill + weekly view). Leaderboard page live with 4 functional tabs, pagination, "You are here" indicator. Opt-out toggle on /profile/edit removes user from all 4 leaderboards. RankBadgeBlock shows on /u/:username for users with attempts (with rank-number visibility honoring opt-out). Dashboard has "View Leaderboard" + "Your rank" pill. Directory shows callout. Trigger keeps `bar_user_colleges` in sync with `profiles.college` edits. Weekly tab respects Monday 00:00 UTC reset. All mobile + dark-mode clean.

