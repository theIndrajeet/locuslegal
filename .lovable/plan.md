## Goal

Kill the admin sidebar (it duplicates the dashboard tiles and eats horizontal space) and make jumping around the admin panel one-click obvious — including a clear "Back" path to the dashboard and to the main site.

## What changes

### 1. Remove the sidebar
- Delete `AdminSidebar` usage from `src/components/admin/AdminLayout.tsx`.
- Drop `SidebarProvider` / `SidebarTrigger` from the admin layout (the global app sidebar isn't used here anyway).
- Keep the file `src/components/admin/AdminSidebar.tsx` for now but unimport it (safe to delete in a follow-up).

### 2. New sticky admin sub-nav (replaces the sidebar)
A single horizontal bar pinned under the main navbar on every `/admin/*` route:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  ← Dashboard   |  Waitlist  Beta  Vacancies  Bar  Updates  Emails  │   ↗ View site │
└──────────────────────────────────────────────────────────────────────┘
```

- **Left**: contextual back button.
  - On `/admin` → shows `← Back to site` (links to `/`).
  - On any other `/admin/*` → shows `← Dashboard` (links to `/admin`).
- **Center**: pill-style tabs for the 6 sections (Waitlist, Beta Testers, Vacancies, The Bar, Updates, Email Log) with the active one highlighted in the brand yellow + neobrutalist border. Lucide icon + label on desktop, icon-only on small screens, horizontally scrollable if it overflows.
- **Right**: small `View site ↗` link (opens `/` in same tab) so admins can pop out of the console quickly.
- Breadcrumb (`ADMIN / DASHBOARD`) stays but moves into this same bar on the far left under the back button on mobile, inline on desktop.

### 3. Dashboard tile improvements
- The dashboard tiles already act as the "menu" — keep them as the canonical entry. Add a subtle hover hint ("Open →") so it's obvious they're navigation, not just stat displays.
- No other changes to `AdminDashboard.tsx` content.

### 4. Per-page back affordance
Inner pages (Waitlist, Beta, Vacancies, Bar, Updates, Email Log) currently rely on the sidebar. With the new sub-nav handling navigation, no per-page change is required — but we'll verify each page header doesn't have its own redundant "back" since the sub-nav covers it.

## Files touched

- `src/components/admin/AdminLayout.tsx` — rip out sidebar, render new `AdminSubNav`.
- `src/components/admin/AdminSubNav.tsx` — **new** component (back button + tab pills + view-site link).
- `src/components/admin/AdminTiles.tsx` — add a small "Open →" affordance on `ToolTile` hover.

## Visual style

Matches existing neobrutalist system — 2px foreground borders, hard yellow accent for the active tab, mono-uppercase micro labels, no emojis (Lucide icons only). Sticky just below the global navbar (`top-16`), full-width, `bg-background/90 backdrop-blur`.

## Out of scope

- No changes to admin page contents or data fetching.
- `AdminSidebar.tsx` left in repo (orphaned) — can be deleted later if you want a clean tree.
