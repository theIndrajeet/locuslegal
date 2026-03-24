

## Multi-Page Website Expansion

### Overview
Convert the single-page landing into a 3-page site: Home (landing/waitlist), Directory (law firms/chambers), and Resources (CV templates, CV analyser, session booking).

### Architecture

```text
/              → Home (current landing page)
/directory     → Firm/Chamber Directory
/resources     → Resources Hub
```

### Changes

**1. Update Navbar (`src/components/Navbar.tsx`)**
- Replace anchor `#hash` links with `react-router-dom` `Link` components
- New nav items: Home (`/`), Directory (`/directory`), Resources (`/resources`), Waitlist (`/#waitlist`)
- Logo links to `/`

**2. Update App routes (`src/App.tsx`)**
- Add routes for `/directory` and `/resources`

**3. Create Directory page (`src/pages/Directory.tsx`)**
- Hero section: "Find Firms, Chambers & Companies" heading
- Filter bar: State, City, Tier (Tier 1/2/3), Type (Law Firm, Chamber, LegalTech Startup, Corporate Legal, IP Boutique)
- Searchable text input for firm name
- Card grid showing filtered results: firm name, type, city, state, tier, brief description
- Data loaded from a static JSON file (`src/data/firms.json`) — you'll provide the actual data and I'll import it. For now I'll seed ~15 sample entries across different states/tiers/types so the filters work
- Responsive: cards in 1-col mobile, 2-col tablet, 3-col desktop

**4. Create Resources page (`src/pages/Resources.tsx`)**
- Hero section: "Resources to Build Your Legal Career"
- 3-4 resource cards in a grid:
  - **Demo CV** — downloadable sample CV (placeholder PDF link)
  - **Cover Letter Template** — downloadable sample (placeholder PDF link)
  - **CV Analyser** — "Coming Soon" card with description and a badge
  - **Book Your Session** — "Coming Soon" card with description and a badge
- Same card styling as the rest of the site

**5. Create shared Layout component (`src/components/Layout.tsx`)**
- Wraps Navbar + Footer + `<Outlet />` so all pages share the same chrome
- Refactor Index.tsx to remove Navbar/Footer (they move to Layout)

**6. Sample data file (`src/data/firms.json`)**
- ~15 entries with fields: `name`, `type`, `city`, `state`, `tier`, `description`
- Covers a spread of states (Maharashtra, Delhi, Karnataka, etc.) and types

### Files Created
- `src/pages/Directory.tsx`
- `src/pages/Resources.tsx`
- `src/components/Layout.tsx`
- `src/data/firms.json`

### Files Modified
- `src/App.tsx` — add Layout wrapper + new routes
- `src/components/Navbar.tsx` — switch to `Link`, update nav items
- `src/pages/Index.tsx` — remove Navbar/Footer (handled by Layout)

