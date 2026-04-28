## Goal

Make the search action **universal** — available on every page (not just `/directory`) — and turn the result UI into a fast, keyboard-friendly **command palette** that searches across firms, playbook guides, tools, resources, and pages, with grouped results, keyboard nav, recent searches, and rich previews.

## UX

- Trigger anywhere:
  - Mobile: tap the always-visible **Search** action pill on the right of the dock (replaces the per-route action; on routes that already have an action like Join/Log, search becomes the third option via a small icon button on the left of the action pill).
  - Desktop: floating bottom-right Search FAB + global `Cmd/Ctrl+K` shortcut. Also `/` to focus.
- Opens a centered glass modal (mobile: bottom sheet) with:
  - Big input, live results as you type (no submit needed).
  - Keyboard nav: arrow keys, Enter to open, Esc to close, Cmd+Enter to open in new tab.
  - Grouped sections with neobrutalist headers: **Firms**, **Playbook**, **Tools**, **Resources**, **Pages**.
  - Each row: icon, title, subtitle (city/area for firms, audience/stage for guides, category for tools), right-side hint chip ("Open", "Download", "Read").
  - Hover/active row: yellow accent border + slight x-shift, matching the project's neobrutalist + glass language.
  - Empty state: shows top suggestions ("Try: Mumbai litigation", "Cold email", "CV Analyser") and last 5 recent searches (localStorage).
  - Footer hint bar: `↑↓ navigate · ↵ open · ⌘K toggle · esc close`.

## Search engine

- Client-side only (no backend needed). Indexes:
  - **Firms** from `src/data/firms.json` (3,890 rows) — scored on `name`, `city`, `area`, `tier`. Capped to top 8 results.
  - **Playbook guides** from `src/content/playbook/index.ts` — title, audience, stage, sections.
  - **Tools** from the `TOOL_CATALOG` array in `src/pages/Tools.tsx` — extract to a shared `src/data/tools.ts` so search can import it without pulling in the page.
  - **Resources** — extract `RESOURCES` array from `src/pages/Resources.tsx` into `src/data/resources.ts`.
  - **Pages** — small static list (Home, Directory, Playbook, Resources, Tools, The Bar, App, Waitlist, CV Analyser).
- Lightweight scorer: lowercase substring + token prefix matching, weighted by field (title 3x, secondary 1x, exact-prefix bonus). No fuse.js dependency — keeps bundle small and fast over 4k rows.
- Debounced 120ms; results computed in a `useMemo` over the lowercased query. Firms array is loaded lazily via `import("@/data/firms.json")` only when the palette first opens, keeping the initial bundle untouched.

## Routing on select

- Firm → `/directory?q={name}` and pre-opens the firm drawer if possible (fallback: just navigates and pre-fills the search).
- Playbook guide → `/playbook/{slug}`.
- Tool → its `href` if present, else `/tools#tool-{num}`.
- Resource → triggers the existing download/preview behavior on `/resources` (navigate + pass `?open={id}` query, handled by Resources page).
- Page → its route.

## Files

**New**
- `src/components/search/CommandPalette.tsx` — modal/sheet, input, keyboard handling, results renderer.
- `src/components/search/searchEngine.ts` — pure functions: `scoreFirm`, `scoreGuide`, `scoreTool`, `scoreResource`, `scorePage`, `runSearch(query)` returning grouped `SearchResult[]`.
- `src/components/search/types.ts` — `SearchResult`, `SearchGroup`, `ResultKind`.
- `src/components/search/useCommandPalette.tsx` — context + provider exposing `{ open, setOpen, toggle }` and registering the global `Cmd/Ctrl+K` and `/` shortcuts. Also stores `recentQueries` in localStorage (cap 5).
- `src/components/search/SearchFab.tsx` — desktop-only floating button (`md:flex`, hidden on mobile to avoid clashing with the dock).
- `src/data/tools.ts` — extracted `TOOL_CATALOG`.
- `src/data/resources.ts` — extracted `RESOURCES`.

**Edited**
- `src/App.tsx` — wrap app with `<CommandPaletteProvider>`, render `<CommandPalette />` and `<SearchFab />` once globally.
- `src/components/MobileBottomDock.tsx` — change `getActionFor` so **search is always available**:
  - On routes with no other action ("none"): action becomes `"search"`.
  - On routes with an existing action (`join`, `log`): render a small secondary search icon-button alongside the primary action pill.
  - All search invocations now call `useCommandPalette().open()` instead of opening the local Sheet. Remove the local `<Sheet>` + `SearchForm`.
- `src/pages/Tools.tsx` — import `TOOL_CATALOG` from `@/data/tools` instead of defining inline.
- `src/pages/Resources.tsx` — import `RESOURCES` from `@/data/resources`; honor `?open={id}` query param to auto-open the matching preview/download.
- `src/pages/Directory.tsx` — read `?q=` (already does) and additionally honor `?firm={name}` to pre-open `FirmDrawer` for that firm.

## Technical details

- Palette uses Radix `Dialog` + the existing `Sheet` for mobile (`useIsMobile()`), so we don't reinvent focus trapping.
- Glass styling matches the dock: `bg-background/70 backdrop-blur-2xl backdrop-saturate-150 border-2 border-foreground/70 shadow-[3px_3px_0_0_hsl(var(--accent))]`.
- Result row component memoized; full result list virtualized only if a single group exceeds 50 rows (firms section is hard-capped at 8, so virtualization is unnecessary in practice).
- Recent searches: `localStorage["locus.search.recents"]` JSON array, deduped, MRU first.
- Accessibility: input has `aria-controls` pointing at results listbox; rows are `role="option"` with `aria-selected`; arrow keys move `activeIndex`, scroll into view via `el.scrollIntoView({ block: "nearest" })`.
- Bundle: firms JSON (~600KB) loaded lazily on first open via dynamic import; cached in module scope after first load.
- Reduced motion: respect `prefers-reduced-motion` for the open/close transition.

## Out of scope

- Server-side full-text search (no Supabase function added — all data is static).
- Searching within profiles, the Bar challenges, or admin tables.
- Saved searches synced across devices (recent searches stay local).
