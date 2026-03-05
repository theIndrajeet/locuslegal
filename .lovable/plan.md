

## Add "For Universities & Law Schools" Section

### Files to Change

**1. New file: `src/components/ForUniversities.tsx`**

A sibling component to `ForFirms.tsx`, using identical patterns: `useScrollReveal` for each block, same card classes (`bg-card rounded-2xl p-8 border border-border`), same typography (`font-heading`, `text-3xl md:text-4xl lg:text-5xl`), same spacing (`py-28 px-4`, `container mx-auto max-w-5xl`), same `Accordion` component for FAQ. 8 blocks total:

- **Block 1 — Hero**: Small caps label, two-line headline with accent on key phrase, subtext paragraph
- **Block 2 — Two-Track Callout**: 2-column grid (`md:grid-cols-2`), cards with tag labels ("No Placement Cell?" / "Already Have One?"), slightly different bg tint (`bg-accent/5` vs `bg-muted/50`)
- **Block 3 — Pain Cards**: 3-column grid, icons from lucide-react (`TrendingDown`, `UserX`, `Building2`), same card hover style as ForFirms
- **Block 4 — Pivot Callout**: Dark panel (`bg-foreground text-background`), bold centered headline + smaller subtext
- **Block 5 — Features**: Heading "Everything your placement cell needs." 6 rows in 2-column grid (`md:grid-cols-2`), each with icon + title + description, using icons like `Handshake`, `LayoutDashboard`, `BadgeCheck`, `Megaphone`, `Briefcase`, `BarChart3`
- **Block 6 — Contrast Callout**: Bordered quote card (`border-2 border-border bg-muted/30`), left-aligned text with last line bold and larger
- **Block 7 — FAQ Accordion**: 4 questions using existing `Accordion` component, heading "Common questions from institutions"
- **Block 8 — Final CTA**: Dark panel, headline, subheadline, button "Register My Institution →" linking to `#waitlist`, microcopy below

**2. `src/pages/Index.tsx`** — Import and add `<ForUniversities />` between `<ForFirms />` and `<WaitlistSection />`

**3. `src/components/Navbar.tsx`** — Add `{ label: "Universities", href: "#universities" }` to `navLinks` array between "Firms" and "Waitlist"

### Notes
- The section gets `id="universities"` for nav anchor linking
- CTA button links to `#waitlist` — the waitlist form doesn't currently have a "university" role option, so no pre-selection logic is added (the form would need a third column/tab for that, which is out of scope per instructions)
- All blocks use separate `useScrollReveal()` refs for staggered fade-up animation
- No new color variables, fonts, or design patterns introduced

