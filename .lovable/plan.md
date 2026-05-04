# Add suggestion chips to "One line they should remember about you"

Step 3 of the Draft Application Email wizard (`src/components/apply/DraftEmailDialog.tsx`, ~L781–799) currently has only a placeholder. Add tappable suggestion chips above the input — personalised first, then generic fallbacks — so users can pick one with a single tap and still edit it.

## Where
`src/components/apply/DraftEmailDialog.tsx`, the `step === 2` block.

## How chips are built
A `useMemo`-style inline list, max **5 chips**, dedup'd, each ≤140 chars:

**Personalised (from loaded `user` profile, in order):**
1. Top internship → `"{role} at {firm_name}"` (or `"Interned at {firm_name}"`)
2. Top moot → `"{result} at {competition}"` (or `"Mooted at {competition}"`)
3. Top publication → `"Published \"{title}\" in {publisher}"`
4. CGPA ≥ 7.5 → `"{cgpa} CGPA at {college}"`
5. Subjects of interest → `"Deep interest in {sub1} & {sub2}"`

**Generic fallbacks (fill remaining slots):**
- Drafted my first commercial contract at 19
- Comfortable with research, citations, and tight deadlines
- Top of class in Contract Law
- Ghost-wrote a published case comment last semester
- Built my own legal-research workflow during COVID

## UI
Small pill chips matching the existing wizard pill style (border, rounded-full, 11px, hover → accent border). Active chip (when its text exactly matches the input) gets the solid accent fill, mirroring `MODE_OPTIONS` / `DURATION_OPTIONS` selected state. Tapping a chip just sets `signature_line` — the input stays editable, the 0/140 counter still works.

## Why this is good
- Zero friction for users who don't know what to write.
- Personalised picks pull from data they already entered (internships / moots / publications / CGPA / subjects), so the first 1–2 chips will usually be ready-to-send.
- Generic chips cover edge cases (no profile data yet).
- Doesn't change wizard flow, layout, or generation pipeline — just gives input shortcuts.
