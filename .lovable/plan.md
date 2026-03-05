

## Expand ForStudents Section — Full 6-Block Rewrite

Replace the current minimal `ForStudents.tsx` with a full persuasive section matching the structure and styling of `ForFirms.tsx`.

### Structure (6 blocks)

**Block 1 — Hero**: Section label "For Law Students", headline "Your college didn't get you here. Your skills will.", subtext about 500,000+ students and only ~600 landing top-firm internships.

**Block 2 — Pain Cards**: 3-column grid with same card styling as ForFirms. Icons: `Mail` (cold emails), `School` (college can't help), `FileText` (CV looks generic). Each with title + body from the provided copy.

**Block 3 — Pivot Line**: Dark panel (`bg-foreground text-background`), centered text: "Merit got you into law school. LexRoot gets you into the room."

**Block 4 — What You Get**: Heading "Built for the 95% that the system ignores." 4 feature rows in 2-column grid (icon + title + body), same layout as ForFirms value props. Icons: `Target`, `BadgeCheck`, `Building2`, `Send`.

**Block 5 — FAQ Accordion**: Heading "Questions students ask us", 3 accordion items (non-NLU concern, 2nd year timing, Internshala/Lawctopus comparison).

**Block 6 — Final CTA**: Dark panel, headline "Your next internship shouldn't depend on who your professor knows.", button "Build My Profile — It's Free →" linking to `#waitlist`, microcopy "No college filter. No referral needed. Just your merit."

### Files Changed

- **`src/components/ForStudents.tsx`** — Full rewrite with 6 blocks, 6 `useScrollReveal` refs, same patterns as `ForFirms.tsx` (imports Accordion, same card classes, same spacing)

No other files change.

