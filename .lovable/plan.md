## The real bug

Points are now updating correctly (52 pts), but accuracy and streak still show 0. Looking at the database for your account:

- 8 total attempts, **0 marked `is_correct = true`**
- Yet several attempts earned partial points (18, 27, 7…)

That's because `is_correct` is only flagged true on **near-perfect** attempts (e.g. all flags right in Document Review, ≥80% in Client Counseling, all stages right + rubric pass in Ethics). Any attempt that earns partial credit is currently logged as `is_correct = false`, so:

- Accuracy = 0 correct / 8 attempts = **0.0%**
- Streak resets on every attempt = **0**

This will hit every user who plays partial-credit question types (document_review, client_counseling, brief_builder, ethics, speed_round, issue_spotter) and rarely lands a perfect score. The metric definition is fundamentally too strict for the scoring model.

## Fix: redefine "pass" as "earned points"

Treat an attempt as a passing/correct attempt for **accuracy and streak purposes** when it earns any points (`points_awarded > 0`). MCQ and Jurisdiction stay binary (they only award points on exact correct), so they're unaffected. Partial-credit types now contribute to accuracy/streak when the user crosses the existing internal pass thresholds (which already award points).

We do this without changing the strict `is_correct` flag stored on `bar_attempts` (the UI uses it to show "Correct/Incorrect" badges and detailed breakdowns — keep that semantics intact).

### Changes

1. **DB migration — update `bar_attempts_after_insert_fn` trigger**
   - Replace `NEW.is_correct` checks with `(NEW.points_awarded > 0)` for:
     - `correct_attempts` increment
     - `current_streak` / `longest_streak` updates
   - Accuracy is derived from `correct_attempts / total_attempts` automatically.

2. **DB migration — backfill existing stats**
   For every user, recompute from `bar_attempts`:
   - `correct_attempts = COUNT(*) FILTER (WHERE points_awarded > 0)`
   - `accuracy_pct = ROUND(correct_attempts * 100.0 / NULLIF(total_attempts,0), 2)`
   - `current_streak` = length of trailing run of `points_awarded > 0` attempts (ordered by `attempted_at`)
   - `longest_streak` = max run of `points_awarded > 0` attempts

3. **No frontend changes required.** `/the-bar` already reads `accuracy_pct` and `current_streak` from `bar_user_stats` via `get_bar_dashboard` and the fallback path — both will now reflect reality.

### Expected result for your account after backfill

- `total_attempts = 8`, `correct_attempts = 4` (the 4 attempts with points 18, 27, 7, and… wait — only 3 earned >0 points; let me recount: 18, 27, 7 → 3 with points)
- Accuracy ≈ **37.5%**
- Current streak = **1** (most recent attempt earned 18 pts)
- Longest streak = **1** (no consecutive scoring runs in your history yet)

These numbers will grow naturally as you keep playing.

### What stays the same

- `is_correct` on each attempt row remains strict (used by review dialogs and per-attempt UI).
- Designation thresholds (which use accuracy floors) — these now become reachable via partial-credit play, which matches the intent of the system.
- All other dashboard fields, leaderboards, RPCs.

Approve and I'll ship the migration + backfill in one go.
