

## Add Dedicated "For Firms" Section

Replace the current `ForFirms.tsx` placeholder with a comprehensive, multi-block section that follows the site's existing design patterns (scroll reveal, card styles, font classes, color variables). Insert it between `ForStudents` and `WaitlistSection` in `Index.tsx` (same position, just expanded content).

### Files to Change

**1. `src/components/ForFirms.tsx`** — Complete rewrite with 8 blocks:

- **Block 1 — Hero Headline**: Section label "For Law Firms & Chambers" in small caps muted text. Large bold headline "You're not short on applicants. You're short on the right ones." with accent styling on key phrase. Subtext paragraph about the network problem.

- **Block 2 — Pain Cards**: Three cards in a `grid md:grid-cols-3` layout (same card style as ForStudents). Icons: `Inbox`, `Building2`, `Clock` from lucide-react. Each with bold title and descriptive body text about flooded applications, NLU pipeline, and bad intern costs.

- **Block 3 — Pivot Line**: Full-width dark background panel (`bg-foreground text-background`) with centered italic quote: "What if your next best intern was already waiting — you just had no way to find them?"

- **Block 4 — Value Props**: Heading "Zero cost. Zero noise. Just the right candidates." Five rows in a two-column layout (`grid md:grid-cols-[auto_1fr]`) with icon+title on left and description on right. Covers pre-screened profiles, custom filters, free forever, reach the unreached, save associate time.

- **Block 5 — Testimonials**: Two quote cards side by side (`grid md:grid-cols-2`), subtle card background, large quote mark, italic text. Senior Partner (Delhi IP firm) and Founding Partner (Mumbai litigation chamber) beta tester quotes.

- **Block 6 — Urgency Banner**: Highlighted banner with `bg-accent text-accent-foreground` (gold/amber). Bold "LexRoot is in early access." with subtext about founding partner status for first 100 firms.

- **Block 7 — Objection Busters**: Three collapsible FAQ rows using the existing `Accordion` component from `@/components/ui/accordion`. Questions about quality, time commitment, and existing platforms.

- **Block 8 — Final CTA**: Dark panel (`bg-foreground text-background`). Headline "List your firm. Find your intern." Subheadline. Full-width button on mobile linking to `#waitlist`. Muted microcopy below.

All blocks use `useScrollReveal()` for fade-up animation on scroll, matching the existing site pattern. Each major block gets its own ref for staggered reveal.

**2. `src/pages/Index.tsx`** — No changes needed. `ForFirms` is already imported and positioned correctly between `ForStudents` and `WaitlistSection`.

### Design Patterns Used
- Same card classes as `ForStudents` (rounded-2xl, border, hover effects, accent gradient line)
- Same typography classes (`font-heading`, `text-3xl md:text-4xl lg:text-5xl`, `tracking-tight`)
- Same spacing (`py-28 px-4`, `container mx-auto max-w-5xl`)
- `useScrollReveal` hook for all animated blocks
- Existing `Accordion` component for FAQ section
- Existing `Button` component with `variant="reverse"` for CTAs
- All links point to `#waitlist` anchor

