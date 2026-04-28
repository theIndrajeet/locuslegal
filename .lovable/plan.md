# Add Startups & SMEs to the Directory

Your spreadsheet has **506 startups, SMEs and corporates** across India — Bangalore (127), Delhi (55), Mumbai (37), Hyderabad (37), Gurgaon (35) etc. Sectors span Fintech (90), SaaS (33+), EdTech (33), HealthTech (29), LegalTech (19), and 100+ more. 502/506 have a contact email. Stages range from Seed → Series K → Listed/IPO/NASDAQ.

This is a fundamentally different dataset from law firms (different fields, different student intent: **cold-outreach for in-house/legal-ops internships** rather than chambers research). So instead of mixing them into one list, we'll add a **second mode** to the Directory.

## What we're building

A new top-level toggle on `/directory` that switches between two universes:

```text
┌─────────────────────────────────────────────────────┐
│  [ Law Firms (5,000+) ]  [ Startups & SMEs (506) ]  │
└─────────────────────────────────────────────────────┘
```

When "Startups & SMEs" is active, the page swaps in a tailored filter bar, card grid, and detail drawer — keeping the same neobrutalist aesthetic, search-as-you-type, pagination, and Cmd+K integration.

### Startup card (grid view)

```text
┌───────────────────────────────────────────────┐
│ Razorpay                          [ Series F ]│
│ Bangalore · Fintech                           │
│                                               │
│ 1001-5000 employees · Has Legal Dept          │
│ Key needs: RBI, Payments, Privacy, IP         │
│                                               │
│ [Visit website]   [Copy email]   [Save]       │
└───────────────────────────────────────────────┘
```

Click a card → drawer opens with website, email, sector, stage, employee band, legal needs, notes, and a one-click **"Log this as an application"** button that pre-fills the existing Application Tracker.

### Filters for startup mode

- **Search** (name, sector, notes)
- **City** — top 15 cities + "All"
- **Sector** — grouped: Fintech, SaaS, HealthTech, EdTech, LegalTech, Logistics, EV/CleanTech, Other
- **Stage** — grouped: Early (Seed–A), Growth (B–D), Late (E+), Listed/IPO, Acquired
- **Employee size** — 1–50, 51–200, 201–1000, 1001–5000, 5000+
- **Has legal team?** — Yes / No / Either (useful signal for "they need an intern" vs "they have one already")
- **Sort** — Name A→Z, Stage (early → late), Most recently funded

## How it slots into the existing app

- **Directory page** (`src/pages/Directory.tsx`) gets a mode toggle at the top. Existing law-firm code stays untouched and behind the "Law Firms" tab. Map view stays law-firms-only (startups don't have lat/long).
- **CompareBar** stays law-firms-only for now (chambers comparison is the differentiated use case).
- **Universal Search** (Cmd+K) gets the 506 startups added to its index, so a search for "Razorpay" or "Fintech Bangalore" surfaces them site-wide.
- **Application Tracker** already has a "Log application" flow — startup drawer's "Apply" button deep-links into it with the firm name pre-filled.
- **SEO** — page meta updates to reflect both ("5,000+ law firms · 500+ startups hiring legal interns").

## Technical details

**Data file** — Convert the xlsx to `src/data/startups.json` at build time (one-off script, then committed). Schema:
```ts
{ name, city, sector, sectorGroup, stage, stageGroup, website, email,
  employees, employeesBand, hasLegalDept, legalNeeds, notes }
```
Pre-compute `sectorGroup`, `stageGroup`, `employeesBand` so filter dropdowns stay snappy without runtime parsing.

**Component structure**:
- `src/data/startups.json` — 506 entries (~80 KB, ships with bundle, no DB needed)
- `src/components/directory/StartupCard.tsx` — card UI
- `src/components/directory/StartupDrawer.tsx` — detail drawer (mirrors FirmDrawer styling)
- `src/components/directory/DirectoryModeToggle.tsx` — the firms/startups switch
- `src/pages/Directory.tsx` — refactor to read `mode` state and conditionally render filter bar + grid

**State**: `mode` lives in URL query (`?mode=startups`) so links and Cmd+K results land in the right view.

**Search index update**: `src/components/search/searchEngine.ts` — append startup entries with `type: 'startup'` and a distinct icon/color in the palette.

**Privacy / abuse concern**: 502 contact emails ship to the client. Per our memory rule (no pricing/payment/early-access language in firms section), I'll keep the framing strictly factual: "Contact email" + Copy button, no auto-mail-to bulk-send affordance, no "outreach campaigns" language anywhere user-facing. The internal spreadsheet's "Judgy-Helmet outreach priority" columns will NOT be exposed — we strip them out during the JSON conversion.

## Out of scope (for this pass)

- Map view for startups (no coordinates in source data)
- Compare mode for startups (chambers comparison is the existing differentiated use case)
- User-submitted startups (would need DB + moderation)
- Personalized "best match" scoring against the user's profile

We can layer any of these on later if you want.

## Approve and I'll build

Once you say go, I'll:
1. Generate `src/data/startups.json` from the spreadsheet (strip internal columns)
2. Build the mode toggle, startup card, drawer, and filter bar
3. Wire startups into the universal Cmd+K search
4. Update page meta + the homepage stats bar count if it references "500+ firms"
