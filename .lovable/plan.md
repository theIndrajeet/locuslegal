
Goal: make The Bar feel fast and keep feed state consistent across accounts (deleted posts/answers disappear everywhere without stale views).

1) Remove the biggest data bottleneck in feed loading
- Add a backend `answer_count` column on `bar_questions` (default `0`).
- Backfill current counts from `bar_answers`.
- Add trigger(s) on `bar_answers` insert/delete/update to maintain `bar_questions.answer_count` automatically.
- Result: feed no longer fetches every answer row just to compute counts.

2) Add missing DB indexes for feed/query speed
- Add indexes used by current UI patterns:
  - `bar_questions(created_at desc)`
  - `bar_questions(votes desc)`
  - `bar_answers(question_id, is_top desc, votes desc, created_at desc)`
  - `bar_answers(parent_id)`
- Result: much faster sort + thread fetch as data grows.

3) Refactor The Bar data fetching to avoid duplicate work
- Replace duplicated loading logic with one `refreshQuestions` function (`useCallback`) used by initial load and refresh actions.
- Fetch only question rows (+ profile name + stored `answer_count`) in one query.
- Remove the extra `bar_answers?select=question_id` full-table request.
- Add lightweight in-flight guard/debounce so rapid sort/filter actions don’t trigger stacked fetches.

4) Fix cross-account stale feed with realtime sync
- Subscribe to backend row changes for `bar_questions` and `bar_answers`.
- On question insert/update/delete: refresh feed.
- On answer insert/delete: refresh feed counts; if detail pane is open for that question, refresh its thread too.
- Cleanly unsubscribe on unmount.
- Result: if one account deletes, other account sees update automatically.

5) Make delete actions feel instant
- Add optimistic local updates after successful delete:
  - remove deleted question from local feed immediately
  - remove deleted answer from current thread immediately
- Keep background refresh for correctness.
- Result: no “it still shows” feeling after delete click.

6) Trim UI rendering pressure on The Bar route
- Defer heavy non-essential footer arcade rendering (lazy-load only when near viewport, or skip on `/the-bar`).
- Keep branding/footer text visible, but avoid mounting game grid during initial feed interaction.
- Result: less main-thread work on The Bar page.

Technical details
- Backend migration:
  - `ALTER TABLE public.bar_questions ADD COLUMN answer_count integer NOT NULL DEFAULT 0;`
  - Backfill update query using grouped `bar_answers`.
  - Trigger function `public.sync_bar_question_answer_count()` for INSERT/DELETE/UPDATE OF question_id on `public.bar_answers`.
  - `CREATE INDEX IF NOT EXISTS ...` statements listed above.
- Frontend (`src/pages/TheBar.tsx`):
  - remove client-side count aggregation query
  - use `q.answer_count` directly for unanswered filter + pills + sidebar counts
  - add realtime channel handlers and a single source of truth refresh function
  - optimistic delete state updates + follow-up refresh
- Footer optimization:
  - either conditional render in `Layout/Footer` for `/the-bar`, or lazy/deferred mount strategy.

Files to update
- `supabase/migrations/<new_timestamp>_bar_perf_and_realtime_sync.sql`
- `src/pages/TheBar.tsx`
- `src/components/Footer.tsx` (or `src/components/Layout.tsx`) for deferred arcade mount behavior

Validation checklist
- Delete a question in Account A; confirm it disappears in Account B without manual refresh.
- Delete an answer in Account A while Account B is on detail view; confirm thread/count updates live.
- Verify feed load now does a single questions query (no full answers-count scan each refresh).
- Confirm sort buttons no longer feel laggy under repeated clicks.
- Confirm The Bar initial interaction is smooth on desktop and mobile.
