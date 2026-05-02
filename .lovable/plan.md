# Pace-Setter Accounts for The Bar Leaderboard

Goal: seed a handful of benchmark accounts so the leaderboard never looks empty, without deceiving real users. Zero leaderboard tells, honest profile disclosure, no automated activity.

## Decisions locked in

- **Quantity**: 4 pace-setter accounts, scattered across rank distribution (one near top, two mid, one lower-mid)
- **Leaderboard UI**: no tell — same row treatment as humans
- **Profile disclosure**: neobrutalist callout reading *"Locus practice account — benchmark stats, not a real user."*
- **Profile content**: display name + avatar + seeded stats only. No college, designation, bio, CV, internships, moots, publications.
- **Activity**: one-time seed of `bar_user_stats`. No `bar_attempts`, no cron, no XP drift. Real users naturally overtake them.
- **Names**: diverse Indian pool (Zoya Khan, Aryan Dsouza, Vikram Singh, Meera Iyer)

## Implementation

### 1. Schema change (migration)
Add a single boolean flag to `profiles`:
```
alter table profiles add column is_pace_setter boolean not null default false;
```
That's the only schema change. No new table, no enum, no role.

### 2. Seed data (insert)
Create 4 auth users (via admin API in a one-shot edge function or manual seed script), then for each:
- `profiles` row: username, display_name, avatar_url (DiceBear or initials avatar), `is_pace_setter = true`, `bar_leaderboard_opt_out = false`
- `bar_user_stats` row: realistic spread
  - Setter A: ~2,400 pts, 88% accuracy, 14-day streak (top-5 territory)
  - Setter B: ~1,650 pts, 81% accuracy, 9-day streak
  - Setter C: ~1,100 pts, 76% accuracy, 6-day streak
  - Setter D: ~640 pts, 71% accuracy, 3-day streak
- No `bar_user_stats_by_area` rows (keeps profile area-breakdown empty, signalling "limited data" naturally)

### 3. Profile page
On the Bar profile route, when `profile.is_pace_setter === true`:
- Render a neobrutalist callout above stats: thick black border, yellow background, Sora heading: **"Locus practice account"** + body: *"Benchmark stats so the leaderboard isn't empty. Not a real user."*
- Hide tabs/sections for: internships, moots, publications, CV, applications, area breakdown
- Keep visible: display name, avatar, total points, accuracy, streaks

### 4. Leaderboard
No code changes. Pace-setters render identically to humans.

### 5. Notifications
Update the welcome / digest / nudge edge functions to skip any user where `is_pace_setter = true` (these accounts have no real inbox we care about; avoids bounces). One-line filter in each `send-*` function's recipient query.

## Files touched

- `supabase/migrations/<new>.sql` — add `is_pace_setter` column
- `scripts/seed-pace-setters.ts` (or a one-shot edge function) — create 4 auth users + profile + stats rows
- `src/pages/BarProfile.tsx` (or wherever the bar profile renders) — disclosure callout + section hiding
- `supabase/functions/send-welcome-email/index.ts`, `send-vacancy-digest`, `send-bar-digest`, `send-profile-nudge`, `send-application-recap`, `send-broadcast` — exclude pace-setters from recipient lists

## Out of scope (deferred)

- Cron-driven XP drift
- Pace-setters posting in The Bar threads
- Localized name pools beyond the initial 4
- Admin UI to add/edit pace-setters (do via SQL for now)

Reply "go" and I'll switch to build mode and ship it.