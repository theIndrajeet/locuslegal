## Beta bug-fix pass (Asmi's report)

Four real issues surfaced. Each has a confirmed root cause in code/data — not guesswork.

---

### Bug 1 — Speed round marks correct answers wrong ("8th" → "8" shown red)

**Evidence:** Asmi's screenshot Q3 *"Schedule listing official languages"* — she typed `8th`, expected `8`, marked X. The grader does a literal `trim().toLowerCase()` compare in `supabase/functions/submit-bar-attempt/index.ts` (`gradeSpeedRound`, line 169). No tolerance for ordinal suffixes ("8th"), spelled-out numerals ("eighth"), Roman numerals, or "Article 8" prefixes.

**Fix:** Add a `normalizeSpeedAnswer()` helper used on both submitted and expected before equality:
- Strip ordinal suffixes (`st|nd|rd|th`)
- Strip leading filler words (`article`, `art`, `art.`, `section`, `sec`, `s.`, `schedule`, `sch.`, `clause`)
- Collapse internal whitespace and punctuation
- Map word-numerals 0–20 + multiples of 10 → digits (`eight` → `8`, `eighth` → `8`)
- Keep canonical Roman → digit map for I–XII (common for schedules)

Mirror the same normalizer in `src/lib/bar/scoring.ts` (`gradeSpeedRound`, line 112) so client-side preview matches server grading. Add a couple of unit tests in `src/lib/bar/scoring.test.ts`.

---

### Bug 2 — Personal Bar dashboard stays at "Trainee 0/0/0" after attempts

**Evidence:** Asmi's account `dc34a9ba…` actually has 6 attempts / 392 pts / 100% accuracy / "Junior Associate" in `bar_user_stats`, yet her screenshot shows the empty Trainee state. The dashboard `useEffect` in `src/pages/TheBar.tsx` only depends on `[authReady, userId]` — it never refetches when she finishes an attempt and navigates back to `/the-bar`. The page is also kept alive in the SPA, so old state persists.

**Fix:**
1. Refetch the dashboard whenever the route becomes visible again — listen to `document.visibilitychange` + a re-mount key tied to `useLocation().key` so navigating back from `/the-bar/challenge/:id` re-runs the RPC.
2. After a successful attempt submission in `src/pages/TheBarChallenge.tsx` / `ResultScreen.tsx`, broadcast a tiny `window.dispatchEvent(new Event("bar:stats-updated"))` and have `TheBar.tsx` listen for it to refetch.
3. Drop the silent `catch {}` swallowing — log the error to console so future failures are visible.

---

### Bug 3 — "Failed to send a request to the Edge Function" when drafting from Directory

**Evidence:** Works from `/vacancies` (Asmi confirmed), fails from Directory drawer. Same component (`DraftEmailDialog`) is used. The retry path in `generate()` (line 384) treats it as transient and retries once — but the toast still fires. Most likely cause: when the dialog opens immediately on directory click, `user` (profile context) finishes loading *after* the auto-trigger, causing a race where the supabase client invokes before the auth token is hydrated, returning a network-style `FunctionsFetchError`.

**Fix:**
1. Guard `generate()` to wait for `ready && userId && user` before allowing invoke; show a tiny "preparing…" state if user context still loading.
2. Increase resilience: bump retry to 2 attempts with 600ms then 1200ms backoff.
3. Surface the actual `error.context.response.status` in the toast when the response *did* come back, so we stop reporting "Failed to send a request" when the function actually returned 4xx/5xx.
4. Add `console.error` with full error object on failure so beta testers' next report includes a usable trace.

---

### Bug 4 — Gmail-copied email pastes as URL-encoded text (`%20`, `%0A`)

**Evidence:** Asmi's second screenshot shows the body pasted as `Subject:%20Legal%20Internship…%0A%0ADear…`. Cause: `buildGmailUrl()` (line 194) uses `encodeURIComponent` for the body, which is correct for the URL — but on iOS Safari, when the user long-presses the Gmail compose body and copies, iOS sometimes copies the underlying mailto/url string instead of the rendered text. Our "Open in Gmail" button on mobile uses `mailto:` which has this exact symptom.

**Fix:**
1. **Always copy the plain-text email to clipboard** *before* opening the mail client (currently we only copy on `truncated`). This guarantees that if the user pastes anywhere — including back into Gmail — they get clean text, not the URL-encoded fallback.
2. Show a clearer success toast: `"Opening Gmail. Plain text also copied — paste if it looks encoded."`
3. Keep mobile `mailto:` (it's the only way to route to default mail apps), but the universal clipboard backup eliminates the user-visible failure.

---

### Files touched

```text
supabase/functions/submit-bar-attempt/index.ts   # add normalizeSpeedAnswer, use in gradeSpeedRound
src/lib/bar/scoring.ts                           # mirror normalizer
src/lib/bar/scoring.test.ts                      # add cases: "8th"=="8", "eighth"=="8", "Article 14"=="14"
src/pages/TheBar.tsx                             # refetch on visibility + custom event, log errors
src/pages/TheBarChallenge.tsx                    # dispatch "bar:stats-updated" after submit
src/components/bar/ResultScreen.tsx              # also dispatch on result render (safety net)
src/components/apply/DraftEmailDialog.tsx        # gate generate on user ready, better retry,
                                                 # always-copy-on-Gmail, surface real error
```

No DB migrations. No new tables. No edge function additions — just edits to one existing function.

### Out of scope (intentionally)

- Asmi's earlier "random logout" report — she confirmed it didn't recur today. Not chasing without a fresh repro.
- The "results show on leaderboard but not personal board" wording — Bug 2 above is the actual cause; once the dashboard refetches, leaderboard and personal board will align.
