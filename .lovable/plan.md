## Part 1 — Thank-you / nudge email (one-off send)

I'll draft and send these now via the existing `send-transactional-email` infra (no new code needed — just an admin-triggered one-off script using the `updates-broadcast` template, addressed individually).

### A. Thank-you to Suha Tarafdar (latest submitter, score 9)
Recipient: `suhatarafdar18@gmail.com`

> **Subject:** Thank you, Suha — your beta notes landed
>
> Hi Suha,
>
> Genuinely thank you for taking Locus through its paces and for the 9/10 — that one mattered. Your note about the site being smooth and hassle-free is exactly the bar we're trying to hold, and the crash you flagged on the Bar questions / results screen has been logged and is being chased down this week.
>
> You're a Founding Tester now — that stays on your record forever. As we ship the next wave (CV Analyser v2, vacancy alerts, deeper Bar feedback), I'll loop you in first.
>
> If anything else surfaces while you keep using it, just hit reply.
>
> — Jeet, Locus

### B. Nudge to the 3 testers who claimed but haven't submitted
Recipients:
- Deeksha Prajapati — `deekshaprajaapti@gmail.com`
- Abhi — `abhishekrana2782003@gmail.com`
- Amaan Husain Rizvi — `amaan.rizvi.legal@gmail.com`

> **Subject:** Your Locus beta seat is still open — 30 mins is all we need
>
> Hi {first_name},
>
> You claimed a Founding Tester seat on Locus a couple of days ago and I didn't want it to slip. The checklist takes ~30 minutes end-to-end and your name stays on the founding wall regardless of score.
>
> Pick it up here: https://locus.legal/beta
>
> Five testers have submitted so far — average 7.2/10 — and the patterns from their feedback are already shaping what ships next. Yours would round it out.
>
> Anything blocking you? Reply to this email and I'll personally clear it.
>
> — Jeet, Locus

I'll send these as 4 individual transactional sends (one trigger per recipient, no looping over a marketing list).

---

## Part 2 — Round-2 Beta Feedback Form

A second form for testers who already completed Round 1. Built around two principles you set:
1. **No repetition** of Round 1 questions (no "did signup work", "did CV upload work", etc.)
2. **Targeted at**: (a) issues they reported and we've since fixed, (b) features shipped *after* their first run.

### What's new since Round 1 (worth asking about)
From the codebase + memory: **Vacancies board**, **Updates broadcasts**, **Universal Cmd+K search**, **Mobile auto-hiding dock**, **Admin dashboard polish**, plus fixes to: signup weak-password error, CV upload <5MB rejection, random session logouts, Bar leaderboard inconsistencies.

### New page: `/beta/round-2`
Gated to users whose email exists in `beta_testers` AND has a `submitted_at` timestamp (so only Round 1 finishers can open it). Same neobrutalist look as `/beta`.

### Form structure (8 sections, ~10 minutes)

**Section 1 — Re-test the bugs you reported (regression check)**
*Only shown if their Round 1 notes mentioned these — otherwise skipped.*
- 1.1 Signup "weak password" error — still happening? (Pass / Still broken / Didn't retry)
- 1.2 CV upload rejecting <5MB files — still happening? (Pass / Still broken / Didn't retry)
- 1.3 Random session logouts — happened again in last 7 days? (No / Once / Multiple)
- 1.4 Bar question crash / wrong results screen (Suha) — reproducible? (free text)

**Section 2 — New: Vacancy Board (`/vacancies`)**
- 2.1 Did you find a vacancy that felt relevant? (Yes / No / Didn't try)
- 2.2 Application email link — did the prefilled draft help? (free text)
- 2.3 What would make you check vacancies daily? (free text)

**Section 3 — New: Universal Search (Cmd+K / search button)**
- 3.1 Did you discover Cmd+K on your own? (Yes / No)
- 3.2 What did you search for first? (free text)
- 3.3 Did the results match what you expected? (1–5 slider)

**Section 4 — Mobile Dock**
- 4.1 Auto-hide on scroll — helpful or annoying? (Helpful / Annoying / Didn't notice)
- 4.2 Which dock icon do you tap most? (single-select)
- 4.3 What's missing from the dock? (free text)

**Section 5 — The Bar (deeper this round)**
- 5.1 Has your accuracy / streak felt rewarding to chase? (1–5)
- 5.2 Which challenge type do you avoid and why? (free text)
- 5.3 Rit (the in-challenge AI) — used again? Quality vs Round 1? (Better / Same / Worse / Didn't use)

**Section 6 — Habits (the real signal)**
- 6.1 Roughly how many times did you open Locus this past week? (0 / 1–2 / 3–5 / 6+)
- 6.2 Which page do you land on first when you open it? (single-select)
- 6.3 What brings you back? (free text)

**Section 7 — Recommend & willingness**
- 7.1 NPS-style: How likely to recommend Locus to a junior at your college? (0–10)
- 7.2 Would you pay anything for Locus today? If so, for what? (free text — no commitment)
- 7.3 One feature you wish existed but doesn't? (free text)

**Section 8 — Final**
- 8.1 Anything you flagged in Round 1 that we *missed* fixing? (free text)
- 8.2 Free space — vent, praise, ideas. (free text)

### Data model
New table `beta_feedback_round2` mirroring `beta_feedback`:
- `id`, `tester_id`, `tester_email`, `tester_name` (snapshot from beta_testers)
- `responses` jsonb (keyed by question id like `2.1`, `3.2`)
- `nps_score` int, `created_at`, `user_agent`
- RLS: anyone authenticated can insert if their email matches a submitted Round 1 row; admins can SELECT all.

Track Round 2 completion on `beta_testers` via a new `round2_submitted_at` column so the admin dashboard can show `5/8 submitted (R1) · X/5 (R2)`.

### Admin surface
Extend `/admin/beta` with a **Round 2** tab: same table layout + CSV export. Add a "Round 2 sent: X / Pending: Y" stat card to `/admin`.

### Entry point
- Direct link in the thank-you/nudge email above (once we send Round 2)
- Banner on `/beta` for users who already submitted Round 1: *"You're in Round 2 territory — give us 10 more minutes."*
- Skip from the global `BetaBanner` (don't double-up)

---

## Order of execution once you approve
1. Send the 4 thank-you / nudge emails (Suha + 3 pending).
2. Create `beta_feedback_round2` table + `round2_submitted_at` column on `beta_testers` + RLS.
3. Build `/beta/round-2` page with the 8-section form.
4. Extend `/admin/beta` with Round 2 tab + CSV export.
5. Add Round 2 entry banner on `/beta` for completed Round 1 testers.

Want me to also queue a Round 2 invite email now (to the 5 Round 1 finishers), or send those manually one-by-one after the form is live?
