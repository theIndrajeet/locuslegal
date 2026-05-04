## Post NUSRL Ranchi CFP for preview

Insert one CFP row directly into the `cfps` table via migration so you can immediately see how the new detail view renders with real data.

### Row contents
- **publication_name**: "National Symposium on Convergence of Law & Economics 2.0: Bankruptcy, Startups & Beyond"
- **publication_type**: `conference`
- **theme**: "Convergence of Law and Economics: Bankruptcy, Startups & Beyond — insolvency, creditor-debtor dynamics, cross-border insolvency, startup regulation, VC frameworks, restructuring"
- **description**: Full structured summary covering timeline (registration 1 May, abstract 3 May, results 6 May, presentation 15 May, event 23 May, full paper 30 June), two-stage submission, abstract guidelines (450–500 words, Garamond 12pt, 1.5 spacing), full paper guidelines (5,000–7,000 words, OSCOLA 4th, <15% similarity), and presentation format (6–8 mins online).
- **submission_deadline**: `2026-05-03 23:59:00+05:30` (abstract deadline — the actionable one)
- **expires_at**: same as submission_deadline
- **word_limit_min**: 5000, **word_limit_max**: 7000
- **co_authorship_allowed**: true
- **peer_reviewed**: true
- **submission_fee**: null
- **eligibility**: "Open to students, research scholars, academicians, lawyers, and other professionals. Co-authorship permitted up to 2 authors. Multiple entries by same author(s) not allowed."
- **submission_url**: `https://docs.google.com/forms/d/e/1FAIpQLSeYqXZZ3HPXpOWISHstbVG8eTUoM6kAaDarYB4jE7tD6bxAHA/viewform`
- **brochure_url**: `https://www.livelaw.in/lawschool/call-for-papers/nusrl-ranchi-national-symposium-convergence-law-economics-20-532062` (source article — no separate brochure PDF in the text)
- **source_credit**: "LiveLaw"
- **status**: `live`
- **created_by**: admin user id (`heyjeetttt@gmail.com`) — looked up via subquery on `auth.users`

### Files to touch
- New migration: `supabase/migrations/<ts>_seed_nusrl_cfp.sql`

### Note
If you'd rather use the admin paste-extract flow to test the AI extractor end-to-end, say so and I'll skip the migration and walk through `/admin/opportunities` → CFP tab → Paste & extract instead.