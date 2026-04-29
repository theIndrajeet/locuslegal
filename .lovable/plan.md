# Final Pre-Beta Audit — Locus

Verdict at the bottom. Read everything first.

## 🔴 BLOCKERS (fix before public beta)

### 1. Beta tester emails are publicly readable
`beta_testers` table has `Anyone can read beta testers` policy with `USING (true)` for `{public}`. The table contains real email addresses (your existing testers — `amaan.rizvi.legal@gmail.com`, etc.). **Anyone visiting your site can `SELECT *` and harvest the list.**

Fix: split into two policies — public sees only `is_public = true` rows with email column excluded (via a view), or restrict to admins entirely.

### 2. CV storage paths leaked via profiles
`profiles` table is publicly readable AND contains `cv_url` (storage path to private CV). Bucket itself is private, but exposing the path enables targeted enumeration/attacks. 

Fix: drop `cv_url` from public read — either via column-level grant revoke, a public view that omits it, or moving CV refs to a user-scoped table.

### 3. Anyone can mark any tester as "submitted"
`beta_testers` UPDATE policy: `USING (submitted_at IS NULL)` for `{public}`. An anonymous attacker can flip every pending tester to "submitted", killing their ability to submit feedback.

Fix: scope to `auth.uid() = user_id` OR require a tester code match.

### 4. No Privacy Policy / Terms of Service
You're collecting names, emails, CVs, college info — and you're in India where DPDP Act 2023 applies. You **need** Privacy Policy + Terms pages before opening signups publicly. Not optional.

### 5. `auth-email-hook` uses LOVABLE_API_KEY for auth — verify it's the right pattern
The hook checks `authHeader === 'Bearer ${LOVABLE_API_KEY}'`. This is the correct Lovable-managed pattern (different from the queue/sender we just fixed), so it should work — but **you have NOT tested fresh signup or password reset since the recent email infra changes**. Could silently be broken. Must smoke test before launch.

## 🟡 SHOULD-FIX (harden during beta)

### 6. User UUID enumeration via public stats
`bar_user_stats`, `bar_user_stats_by_area`, `bar_user_colleges` are all `USING (true)` and expose raw `user_id` UUIDs. Lets anyone enumerate every user on the platform. Fix via a public view that joins on profile username and drops user_id, or filter by `bar_leaderboard_opt_out = false`.

### 7. SECURITY DEFINER functions callable by anon/auth
40+ functions flagged. Most are intentional (`get_public_profile`, `has_role`, etc.) but worth a once-over to revoke `EXECUTE` from `anon`/`authenticated` on anything that shouldn't be callable directly (e.g., `claim_beta_slot`, `enqueue_email`, `move_to_dlq`).

### 8. `extension_in_public` warning
Likely `pgmq` or `pg_net` installed in `public` schema. Cosmetic but worth moving to `extensions` schema later.

### 9. `function_search_path_mutable` (4 functions)
A handful of DB functions don't set `search_path`. Minor SQL injection hardening — set `SET search_path = public` on each.

### 10. Frontend on `locus.legal` may be stale
Backend changes (edge functions, DB) deploy instantly. **Frontend changes only go live when you click "Update" in the Publish dialog.** Your last week of UI work (admin dashboard refresh, email viewer, etc.) might not be live. Verify before announcing.

### 11. `/dock-lab` is exposed in production routes
That's a dev/lab page. Should be removed from prod routes or gated behind admin check.

## 🟢 PASSING / GOOD

- Email pipeline end-to-end working (auth fix + queue + suppression + unsubscribe)
- RLS on all sensitive tables (applications, internships, moots, publications, votes, profile data) properly scoped to `auth.uid() = user_id`
- Admin role stored in separate `user_roles` table (correct pattern, no privilege escalation surface)
- `is_admin()` helper used consistently across policies
- Suppression / unsubscribe / DLQ infrastructure in place
- Service-role-only access correctly enforced on `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`
- 32 routes wired, lazy-loaded, prefetch optimized
- robots.txt blocks `/admin` and `/beta` from search engines (good)
- sitemap.xml present
- Admin layout properly gated via `useAdminRole`

## Pre-launch checklist (in order)

1. **Fix the 3 RLS issues** (#1, #2, #3) — these are real exploitable bugs, ~1 hour of work
2. **Add Privacy Policy + Terms pages** (#4) — legally required, can be templated
3. **Smoke test auth emails** (#5) — fresh signup + password reset on a burner email
4. **Publish (click Update in Publish dialog)** so the live site is current
5. **Remove or gate `/dock-lab`** (#11)
6. **Soft-launch to your existing `/beta` list** (10–50 people) for 48h before broader announcement
7. (Post-launch) work through #6–#9

## Verdict

**NOT READY for public beta yet.** You're 60-90 minutes of focused work away from being ready. The blockers are all real (especially #1 — leaking beta tester emails publicly is bad) but every single one is fixable today.

After these fixes: green light for soft launch.
