## Finish Opportunities Board v2

Five remaining pieces to complete the migration from Vacancies → Opportunities.

### 1. Admin `/admin/opportunities`
New page with 4 tabs (Vacancies / CFPs / Moots / Competitions). Each tab gets:
- List view (live + archived rows, status pill, delete/archive actions)
- "Add manually" dialog with stream-specific form fields
- "Paste & extract" dialog calling `extract-opportunity` edge function (Gemini parses raw text → prefilled form)
- Add link tile on `/admin` dashboard hub

### 2. Navbar + mobile dock label swap
- Desktop nav: `Vacancies` → `Opportunities`, link to `/opportunities`
- Mobile dock: same label + icon update (Briefcase stays appropriate)

### 3. `/vacancies` → `/opportunities` redirect
- React Router `<Navigate to="/opportunities" replace />` for `/vacancies`
- Keeps old links/SEO working

### 4. Universal Search (Cmd+K)
Add three new sources to the command palette:
- CFPs (publication_name + theme)
- Moots (competition_name + organiser)
- Competitions (title + category)
Each routes to `/opportunities?focus=<id>`

### 5. Memory update
- New file `mem://features/opportunities-board` documenting the 4-stream architecture, lifecycle, digest cadence
- Retire/replace `mem://features/vacancy-board` reference in index
- Delete demo `OpportunitiesPreview.tsx` + `sampleData.ts` (now superseded by live `Opportunities.tsx`)

### Out of scope
Bookmarks, one-click apply, public submission forms, push notifications.

### Files touched
- **Created:** `src/pages/AdminOpportunities.tsx`, `src/components/admin/opportunities/{VacanciesTab,CFPsTab,MootsTab,CompetitionsTab,PasteExtractDialog}.tsx`, `mem://features/opportunities-board`
- **Edited:** `src/App.tsx` (routes + redirect), `src/components/Navbar.tsx`, `src/components/MobileDock.tsx`, `src/pages/AdminDashboard.tsx`, `src/components/UniversalSearch.tsx` (or equivalent), `mem://index.md`
- **Deleted:** `src/pages/OpportunitiesPreview.tsx`, `src/components/opportunities-preview/` directory
