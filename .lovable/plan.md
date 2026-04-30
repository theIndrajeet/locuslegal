I found the likely root cause: the database function powering `/the-bar` calls `row_to_jsonb(t)`, but that function does not exist in Postgres. That makes the dashboard RPC fail, which is why the UI shows `Couldn't refresh stats` and falls back to 0 points even though attempts are actually being recorded.

Plan:

1. Fix the backend dashboard function
   - Add a migration that replaces `row_to_jsonb(t)` with the correct `to_jsonb(t)` inside `get_bar_dashboard`.
   - Keep the existing owner-only protection so users can only fetch their own dashboard.
   - Preserve the existing response shape: `stats`, `recent`, `opted_out`, and `overall_rank`.

2. Add a safer client fallback on `/the-bar`
   - If `get_bar_dashboard` fails again for any reason, fetch directly from `bar_user_stats`, `bar_attempts`, and `profiles` for the logged-in user.
   - This ensures the dashboard still shows points/recent attempts instead of staying at 0 with only a retry link.
   - Use `.maybeSingle()` for single-row reads, matching the project rule.

3. Use result-screen stats immediately after a submitted attempt
   - When `submit-bar-attempt` returns `new_stats`, store those stats in `sessionStorage` along with `bar:lastSubmitAt`.
   - On `/the-bar`, read that cached result first so the dashboard updates instantly on navigation back, then reconcile with the backend fetch.

4. Improve the error state
   - Replace the tiny `Couldn't refresh stats` line with a clearer non-scary note only when both the primary RPC and fallback fetch fail.
   - Keep Retry available, but users should normally never need it after this fix.

5. Verify data consistency
   - Run a read query after the migration to confirm the admin account’s recorded attempts and `bar_user_stats` row match.
   - Confirm `/the-bar` can load from the repaired RPC without showing the refresh error.