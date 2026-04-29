# Unified Admin Dashboard

Right now the admin surface is scattered across 5 separate routes with no shared entry point. The only nav link in the navbar (`AdminNavLink`) points directly to `/admin/bar`, so to reach the others (Waitlist, Beta, Vacancies, Updates) you have to know the URL or be linked from within a tool.

This plan adds a single hub at **`/admin`** that puts everything in one place, plus a left sidebar shell so jumping between admin tools is one click — without rewriting any of the existing tool pages.

## What gets built

### 1. `/admin` — Dashboard home
A new landing page showing:
- **At-a-glance stat cards** (live numbers from the DB):
  - Waitlist signups (total + last 7 days)
  - Beta testers claimed / submitted
  - Live vacancies + expiring soon
  - The Bar: pending challenges, total attempts (24h)
  - Updates: last broadcast sent, recipients
  - Email health: sent / failed (last 24h, deduped by `message_id`)
- **Tool tiles** — neobrutalist cards (Black/White/Yellow, hard shadow) for each admin section with icon, name, one-line description, and a primary action.
- **Recent activity strip** — latest 5 waitlist entries, latest 5 vacancies, last broadcast.

### 2. Admin shell with sidebar
A new `AdminLayout` wraps every `/admin/*` route using shadcn `Sidebar` (`collapsible="icon"`):
- Sidebar items: Dashboard, Waitlist, Beta Testers, Vacancies, The Bar, Updates, Email Log
- Active route highlighted, collapsible to icon-only on narrow viewports
- Header bar with `SidebarTrigger` + breadcrumb ("Admin / Vacancies")
- Admin role guard moved into the layout (single check instead of 5 duplicates)

### 3. New: Email Log viewer (`/admin/emails`)
Since email infra is now central, add a read-only viewer over `email_send_log` with the six required dashboard features (time range, template filter, status filter, summary stats, deduped table by `message_id`, pagination). This is a natural fit for the hub and replaces the current "no visibility" gap.

### 4. Navbar update
`AdminNavLink` retargeted from `/admin/bar` → `/admin` so the nav lands on the hub.

## Files

**New**
- `src/pages/AdminDashboard.tsx` — hub page (stats + tool tiles + recent activity)
- `src/pages/AdminEmails.tsx` — email log viewer
- `src/components/admin/AdminLayout.tsx` — sidebar shell + role guard + outlet
- `src/components/admin/AdminSidebar.tsx` — sidebar nav
- `src/components/admin/StatCard.tsx`, `ToolTile.tsx` — small presentational pieces

**Edited**
- `src/App.tsx` — wrap `/admin/*` routes in `AdminLayout`, add `/admin` and `/admin/emails`, lazy-load the new pages
- `src/components/AdminNavLink.tsx` — link to `/admin`
- `src/lib/prefetch.ts` — register the new routes
- `src/pages/AdminWaitlist.tsx`, `AdminBar.tsx`, `AdminBeta.tsx`, `AdminVacancies.tsx`, `AdminUpdates.tsx` — remove their now-duplicate `useAdminRole` guards and outer page padding (the layout handles both); keep all internal logic untouched
- `mem://index.md` + new `mem://features/admin-dashboard.md` — record the hub structure

## Technical notes

- **Stats** are fetched in parallel via `Promise.all` on the dashboard page using existing tables (`waitlist_submissions`, `beta_testers`, `vacancies`, `bar_challenges`, `bar_attempts`, `update_broadcasts`, `email_send_log`). All counts use `head: true, count: 'exact'` for cheap reads.
- **Email log** queries go through a tiny new edge function `admin-email-log` (admin-gated via `is_admin(auth.uid())`) because `email_send_log` is service-role only by RLS. Returns deduped rows by `message_id`.
- **Sidebar** uses shadcn `Sidebar` with `collapsible="icon"`; on mobile it becomes the off-canvas variant. Trigger lives in the admin header so it's always visible.
- **Styling** stays neobrutalist: 2px borders, hard `shadow-[4px_4px_0_0_#000]` on cards/tiles, Yellow accent for primary CTAs, zero emojis, Lucide icons throughout.
- **No breaking changes** — every existing admin URL keeps working; the layout just wraps them.

## Out of scope (call out, don't build)

- Editing/composing from the dashboard itself — tiles deep-link into the existing tool pages.
- Real-time updates — stats refresh on mount + manual refresh button (cheap, accurate enough for an admin hub).
- Role management UI — still done via SQL as today.
