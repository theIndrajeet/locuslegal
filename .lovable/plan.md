

## Add "Playbook" Guides Page

### What
A new `/playbook` page styled as a legal docket/case file system — split-panel layout with a filterable guide index on the left and a detail preview on the right. Plus a nav link and route.

### Files

| Action | File |
|--------|------|
| Create | `src/pages/Playbook.tsx` — full page component with all logic |
| Edit | `src/components/Navbar.tsx` — add "Playbook" link between Directory and Resources |
| Edit | `src/App.tsx` — add `/playbook` route |

### Implementation

**`src/pages/Playbook.tsx`**
- Static array of 14 guides with id, caseNumber, title, audience (Students/Firms/Institutions), stage, readTime, slug, and sections array
- State: `activeFilter` (All/Students/Firms/Institutions), `selectedGuide` (id or null), `mobileDetailOpen` (boolean)
- **Left panel** (w-[300px] fixed on desktop, full-width on mobile):
  - "THE LOCUS PLAYBOOK" uppercase tracking label
  - Filter pills: All | Students | Firms | Institutions — active pill gets gold accent
  - Scrollable list of guide entries with case number (monospace, muted), bold title, colored category tag (green/blue/orange tints)
  - Active entry gets `border-l-2 border-[#D4A017]`
  - Right border separator
- **Right panel** (flex-1):
  - Empty state: "Select a guide to preview" centered muted text
  - Selected state: top bar with case number + stage (monospace), large bold title, "Read Guide" (gold filled) + "Download PDF" (outlined) buttons, metadata row (Audience / Read Time / Stage), divider, "What's inside" section list with numbered cards
- **Mobile**: left panel is full-width list; tapping a guide sets `mobileDetailOpen=true` showing detail view with a back button; no side-by-side

**`src/components/Navbar.tsx`**
- Add `{ label: "Playbook", href: "/playbook" }` between Directory and Resources in `navLinks`

**`src/App.tsx`**
- Import Playbook page, add `<Route path="/playbook" element={<Playbook />} />`

**Document title**: Set via `useEffect` to "The Locus Playbook — Guides & Resources | Locus by LexRoot"

