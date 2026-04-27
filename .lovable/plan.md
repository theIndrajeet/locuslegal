## Locus Closed-Beta Tester Checklist (PDF)

A one-time generated PDF for your 6 closed testers. No app code changes — pure artifact, delivered to `/mnt/documents/`.

### Format
- US Letter, neobrutalist styling (black borders, yellow accent, mono labels) to match Locus brand
- ~6–7 pages, structured by **user journey** (the way a real student would experience Locus day 1 → day 7)
- Each task row has: task description, steps, expected result, and three tickboxes — **PASS / FAIL / BLOCKED** + a "Bug + screenshot ref" line
- Cover page: tester name, date, device/browser, build URL (locuslegal.lovable.app)
- Final page: overall impressions, top 3 frustrations, top 3 delights, "would you recommend to a friend?" 1–10

### Journey structure (covers what's actually live)

**Stage 1 — First impression (5 min)**
Land on home, scroll, click around hero, navigate to Directory, Playbook, Tools as a guest.

**Stage 2 — Sign up & profile (5 min)**
Email + Google + Apple signup paths, choose username, complete profile (avatar, bio, academics, CGPA, subjects, internships, moots, CV upload), watch Profile Strength meter climb.

**Stage 3 — Get discovered (3 min)**
Visit own public profile at `/u/:username`, share the link, toggle "Open to opportunities".

**Stage 4 — Practice law: The Bar (8 min)**
Open `/the-bar`, attempt one of each: MCQ, Issue Spotter, Speed Round, Brief Builder, Client Counseling. Chat with Rit. Check leaderboard + history.

**Stage 5 — Hunt internships (5 min)**
Browse Directory, filter, open firm drawer, compare 2 firms, log an application in Tracker, check insights + nudge banner.

**Stage 6 — Learn & level up (3 min)**
Open one Playbook guide, mark sections complete, download a Resources template, run CV Analyser, try one document drafter (NDA).

**Stage 7 — Wrap (1 min)**
Mobile bottom dock, log out, log back in, password reset.

### Technical approach
- Generate with Python + ReportLab (Platypus flowables for clean tables/checkboxes)
- Brand: black borders 2pt, hard shadow offset, Locus yellow `#FACC15` for accents, Inter/Helvetica fallback
- Output: `/mnt/documents/locus-beta-checklist.pdf`
- Mandatory QA: render every page to JPEG, inspect for clipping/overlap/contrast, fix and re-render until clean
- Deliver via `<lov-artifact>` so you can download and forward to all 6 testers

### What I will NOT do
- No new app routes, no `/beta` page, no DB tables — pure downloadable artifact
- No editable docx version unless you ask after seeing the PDF

Approve and I'll generate it.