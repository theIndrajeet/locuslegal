## What I found when QA'ing Round 2

I navigated to `/beta/round-2` and confirmed:

- **Gate works correctly** — without a Round 1 token, the page shows "Round 1 first." and blocks entry. Good.
- **Submission code is correct** — `BetaRound2.tsx` inserts into `beta_feedback_round2` (RLS allows public insert), then calls the `mark_beta_tester_round2_submitted` RPC. Plumbing is sound.
- **But there's a real blocker:** the only way the form unlocks is if `localStorage["locus-beta-tester-id-v2"]` is set on the same browser. That value is written *only* by the Round 1 page (`/beta/<code>`) when a tester opens their personal link. After Round 1 submission, every tester's `code` was cleared to `NULL`, so **none of the four eligible testers (Suha, Aditi, Asmi, Ritika) can re-seed the token** if they open Round 2 in a new browser, on mobile, or after clearing site data.

This is also why I can't run the real end-to-end test in the browser tool — there's no path to obtain the token without the Round 1 link.

## The fix

Two small changes that unblock testing AND testers:

### 1. Add a recovery entry path: `/beta/round-2?as=<email>`

If the URL has an `as=<email>` param and no localStorage token is present, look up the matching tester by email via a new SECURITY DEFINER RPC `find_round2_tester(p_email text)` that returns `{ id, display_name, email, submitted_at, round2_submitted_at }` **only if `submitted_at IS NOT NULL`**. If found, set localStorage and proceed. If not eligible, show the existing "Round 1 first." card.

This lets us put a real, share-safe link in the Round 2 invite emails (e.g. `https://locus.legal/beta/round-2?as=suhatarafdar18@gmail.com`). Email is not a secret here because the page is gated by `submitted_at` (only completed Round 1 testers pass) and the page itself is `noindex`.

### 2. Surface a "I'm on a new device" recovery on the gate card

Below the "Go to /beta" button on the Round 1-first card, add a small inline form: *"Already submitted Round 1? Enter the email you used:"* → calls the same RPC. This way the four eligible testers can self-recover without needing a custom link.

### 3. Then run the real QA

Once the `as=` param works, I'll:
- Open `/beta/round-2?as=suhatarafdar18@gmail.com` in the browser tool
- Fill the NPS slider (the only required field), add a short note in one section
- Submit and verify a row lands in `beta_feedback_round2` and `beta_testers.round2_submitted_at` is set for Suha
- Confirm `/admin/beta` Round 2 tab shows the submission and the CSV export contains it
- Then **delete that QA row** so Suha's real submission isn't pre-populated

## Technical details

- **New RPC** `public.find_round2_tester(p_email text) returns table(...)` — `SECURITY DEFINER`, `SET search_path = public`, returns the row only when `lower(email) = lower(p_email) AND submitted_at IS NOT NULL`. Granted to `anon, authenticated`.
- **`src/pages/BetaRound2.tsx`** — in the boot effect, after checking localStorage, also read `?as=` from `window.location.search` and call the new RPC as a fallback. On success, persist to localStorage and clean the URL with `history.replaceState` so the email isn't kept in the address bar.
- **Gate card** — add a tiny `<form>` with an email input + "Recover access" button that calls the same RPC.
- **No schema changes** beyond the RPC.

## What I won't do

- I won't relax the gate to "anyone with the link" — keep the `submitted_at IS NOT NULL` check.
- I won't expose Round 1 codes again or resurrect them.
- No changes to question content, scoring, or the admin dashboard.

After approval I'll implement, then run the live submission test and report back with the inserted row's id and the `round2_submitted_at` timestamp.