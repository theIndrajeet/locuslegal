# Opportunities Board v2 — Visual Demo Page

Build a **frontend-only demo** at `/opportunities-preview` so you can see and feel the v2 board before any database, edge function, or admin work happens. Zero backend changes. Zero migrations. Pure UI with hardcoded sample data.

---

## What you'll be able to click through

A single new route: **`/opportunities-preview`** (not linked from anywhere — accessible only by typing the URL, so it stays out of the live nav).

The page renders the full v2 experience using local sample arrays:

- Hero strip: "Opportunities" title, one-line subtitle, total live count
- Segmented control: **All · Internships · Jobs · CFPs · Moots · Competitions** (chips, neobrutalist with hard shadow)
- Unified feed below — interleaved cards sorted by posted date, colour-coded by stream
- Clicking a chip filters in place (no route change in the demo)
- Clicking a card opens a stream-specific detail dialog with all the typed fields populated from sample data

A small **"Demo mode"** banner at the top makes it obvious this is a prototype — nothing is real, nothing persists.

---

## Sample data (hardcoded in the page file)

Three to four realistic items per stream so you can see card variety:

- **Internships / Jobs**: reuse the same shape as the current `vacancies` table — sample firms (Trilegal, AZB, a tier-2 boutique, an in-house role)
- **CFPs**: NLSIR Vol. 38, SCC OnLine Blog rolling, Indian Journal of Constitutional Law, NUJS Law Review symposium
- **Moots**: Vis Vienna Pre-Moot, NLSIU Moot, Manfred Lachs Space Law, an online IP moot
- **Competitions**: Bar Council essay competition, a fellowship at Vidhi, an MUN, a pro-bono drive

Each item carries every typed field from the plan (deadline, fee, prize, mode, eligibility, etc.) so the cards and dialogs look real.

---

## Components to add (demo-only, throwaway-friendly)

```
src/pages/OpportunitiesPreview.tsx                — the demo page itself
src/components/opportunities-preview/
  ├── OpportunityCard.tsx                          — generic card, variant prop per stream
  ├── StreamChip.tsx                               — segmented control chip
  ├── DemoBanner.tsx                               — "this is a preview" strip
  ├── CfpDetailDialog.tsx                          — per-stream detail modals
  ├── MootDetailDialog.tsx
  ├── CompetitionDetailDialog.tsx
  ├── VacancyDetailDialog.tsx
  └── sampleData.ts                                — all hardcoded items
```

Everything lives under an `opportunities-preview/` folder so it can be deleted in one move once the real build starts.

---

## Visual language per stream

Each card uses the project's existing neobrutalist treatment (hard 2px black border, hard offset shadow) with a stream accent strip on the left edge:

| Stream         | Accent       | Pill label        | Icon (Lucide) |
|----------------|--------------|-------------------|---------------|
| Internship     | Yellow       | INTERNSHIP        | Briefcase     |
| Job            | Yellow       | FULL-TIME         | Building2     |
| CFP            | Blue         | CALL FOR PAPERS   | FileText      |
| Moot           | Purple       | MOOT              | Gavel         |
| Competition    | Green        | COMPETITION       | Trophy        |

Card body shows: stream pill, title, organiser/firm, 2-3 key meta chips (deadline countdown, mode, fee/prize), and a "View details" CTA.

Detail dialogs render every field — deadlines as live countdowns ("closes in 4d 6h"), URLs as outbound buttons, eligibility/description as paragraphs.

---

## What the demo deliberately fakes

- No real DB reads — everything from `sampleData.ts`
- No email triggers, no admin tools, no `/admin/opportunities` route
- Filter chips work in local React state only (no URL sync, no sub-routes)
- "Apply" / "Submit" buttons are inert (no-op on click, with a tiny tooltip "Demo only")
- Universal search (Cmd+K) is not modified

This keeps the surface area tiny and reversible — when you approve the real build, the preview folder gets deleted and the production v2 takes over `/opportunities`.

---

## Out of scope for the demo

- Mobile dock label changes
- Search engine sources
- Email templates / digests
- Admin paste-extract UI
- Any database migration

---

## After you see it

You'll be able to:
1. Walk through the 5 streams visually
2. Decide if the colour coding / card density / chip layout works
3. Tell me which fields to add/remove per type
4. Approve the real build, which then replaces the demo
