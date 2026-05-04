# Unify Opportunities Admin + Richer Public Detail

Two changes:

## 1. Admin: embed Vacancies CRUD inside `/admin/opportunities`

Currently the Vacancies tab on `/admin/opportunities` just shows a "Open Vacancies admin" link redirecting to `/admin/vacancies`. Bring it inline so all four streams live under one umbrella.

**Edit `src/pages/AdminOpportunities.tsx`:**
- Add a new `VacanciesPanel` component (mirrors existing `StreamPanel` shape — Live + Archived sections, Add/Edit/Archive/Delete buttons).
- Reuses existing `AdminVacancyDialog` from `src/components/vacancies/AdminVacancyDialog.tsx` (which already has the AI paste-extract flow).
- Vacancies tab content swaps from the redirect card to `<VacanciesPanel userId={userId} />`.
- Remove `ExternalLink` import; add `Pencil`, `Archive`, `daysLeft`, `Vacancy` type imports.

**Sidebar/redirect cleanup** (`src/components/admin/AdminSidebar.tsx`, `src/App.tsx`):
- Remove the "Vacancies" sidebar item (now lives under "Opportunities").
- Keep `/admin/vacancies` route alive but make it `<Navigate to="/admin/opportunities" replace />` so old bookmarks still land somewhere sensible.

## 2. Public: richer detail dialogs for CFPs / Moots / Competitions

The current `DetailDialog` in `src/pages/Opportunities.tsx` shows a flat 2-column key/value `<dl>` — fine for vacancies but underwhelming for the long-form streams.

**Edit `src/pages/Opportunities.tsx`:**
- Replace flat `DetailFields` with a structured layout per stream:
  - **Hero band** (top of dialog): big stream pill, title, organiser/publisher, prominent countdown chip in accent color, posted-on date.
  - **Key facts grid** (3-col on desktop, 2-col mobile): icon + label + value tiles for the most important specs (Mode, Venue/Location, Deadline, Prize/Stipend, Word limit, Fee, Eligibility-summary, Peer review badge, Co-author badge, Event window).
  - **About section**: full description with proper prose styling (`whitespace-pre-wrap`, increased line-height, max-width).
  - **Eligibility callout**: separate bordered block when eligibility text is long (>80 chars), with `GraduationCap` icon header.
  - **Source attribution footer**: small muted line "Curated by Locus" or "Source: X" with a divider above.
  - **Sticky CTA bar** at dialog bottom: brutalist button + secondary "Copy link" button (deep-link to `/opportunities?focus=<id>`).
- Use Lucide icons consistently: `Calendar`, `Clock`, `MapPin`, `Globe`, `Trophy`, `Coins`, `FileText`, `GraduationCap`, `BadgeCheck`, `Users`.
- Vacancy detail keeps current shape but gains the same hero band + sticky CTA for visual parity.
- Add scroll-fade gradient at the bottom of the scrollable area.

**No DB or edge function changes.** All data already exists on the row.

## Files

- Edit: `src/pages/AdminOpportunities.tsx`
- Edit: `src/pages/Opportunities.tsx` (DetailDialog + DetailFields rewrite)
- Edit: `src/components/admin/AdminSidebar.tsx` (remove standalone Vacancies entry)
- Edit: `src/App.tsx` (redirect `/admin/vacancies` → `/admin/opportunities`)

## Out of scope
- Cron schedule for `send-opportunity-digest` (separate ask).
- New fields on tables.
- Public list-card redesign (only the modal).
