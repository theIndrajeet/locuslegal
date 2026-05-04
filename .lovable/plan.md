Two things, both cleanly solvable with what already exists.

## 1. Admin access for Ritika (and the bigger question: scoped vs. full)

### Decision needed first

Your DB and admin UI are built around a single `is_admin()` check. Every RLS policy on `vacancies`, `cfps`, `moots`, `competitions`, plus broadcasts / waitlist / Bar / firm suggestions, all use the same `admin` role from `user_roles`. There is no built-in concept of "admin for Opportunities only".

Two ways forward:

**Option A — Give Ritika full `admin` role (recommended)**
- Insert one row: `(user_id = ritika, role = 'admin')`.
- She immediately gets access to `/admin` and every admin tool — Opportunities AND Waitlist, Beta, Bar, Broadcasts, Firm Suggestions.
- Same dashboard you see, no new UI, no new code.
- Trade-off: she can see the waitlist, beta feedback, Bar internals, and send broadcasts. If she's a trusted collaborator, this is fine and is how most teams ship.

**Option B — Build a scoped `opportunity_manager` role**
- Add a new enum value to `app_role`.
- Rewrite RLS on `vacancies`, `cfps`, `moots`, `competitions` to accept admin OR opportunity_manager.
- Add a `useCanManageOpportunities()` hook.
- Rewrite `AdminLayout` + `AdminSubNav` + `AdminDashboard` to filter visible tools by what the role permits.
- Add a per-tool guard so opportunity_manager users hitting `/admin/waitlist` get a 403.
- Multi-day refactor; significant test surface.

**My recommendation: Option A.** If the trust ever changes, Option B can be layered in later. I'll proceed with Option A unless you say otherwise.

### What I'll do for Ritika (Option A)

- Insert `(user_id = '257f6569-d17c-4464-be64-167dd1c22868', role = 'admin')` into `user_roles`. That's the `ritikaraj915` profile we found earlier — please confirm that's actually her before I run it (the other "Ritika" was `ritikajuris` with display name "Ritika").

## 2. Admin manager panel in your dashboard (so you stop pinging me)

Add a new admin-only page at `/admin/admins`:

**UI** — a single neobrutalist card on `/admin` (new tile "Admin Access") leading to a page that:
- Lists current admins with username, display name, email, and a `Revoke` button (with a confirm — you can't revoke yourself).
- Has a single search box: type a username OR an email. Live-search hits a new SECURITY DEFINER RPC `find_user_for_admin(query text)` that returns up to 10 candidates (id, username, display_name, masked email) so you can pick the right one before granting.
- Click `Grant admin` on a result → inserts into `user_roles`, refreshes list, toasts success.

**Why an RPC instead of direct queries**
- `auth.users` is not directly readable from the client. The RPC joins `profiles` + `auth.users` to expose just enough (id, email) to identify the right person.
- The RPC is gated by `is_admin(auth.uid())` so only admins can search.
- The `user_roles` table already has the right RLS — only admins can insert/delete roles, which is exactly what we need.

**Safety rails**
- Cannot grant a role that already exists (DB will silently no-op via `ON CONFLICT DO NOTHING`).
- Cannot revoke yourself (UI guard + RPC guard).
- All actions go through the same `is_admin()` check so a non-admin getting to the URL sees `Access Denied` from `AdminLayout`.

## Files & migrations

**Migration**
- New SECURITY DEFINER RPC `find_user_for_admin(p_query text)` that returns matching users (id, username, display_name, email) — admin-only via `is_admin(auth.uid())` guard.
- New SECURITY DEFINER RPC `grant_admin_role(p_user_id uuid)` and `revoke_admin_role(p_user_id uuid)` — both admin-gated, with self-revoke protection.

**Frontend**
- `src/pages/AdminAdmins.tsx` — new page (search + list + grant/revoke buttons).
- `src/App.tsx` — register `/admin/admins` route under the admin layout.
- `src/pages/AdminDashboard.tsx` — add a `Shield`-icon `ToolTile` for "Admin Access".
- `src/components/admin/AdminSubNav.tsx` — optional: add an `Admins` tab to the sub-nav.

**Data insert**
- One `INSERT` into `user_roles` for Ritika once you confirm the username is correct.

## What I will NOT do

- Will NOT touch the Opportunities admin code itself — RLS already allows any admin to post.
- Will NOT build a separate "limited admin" UI variant in this round (Option B above). Easy to add later if needed.
- Will NOT add email notifications when someone is granted admin (let me know if you want that).

Approve and I'll ship — and please confirm Ritika is `ritikaraj915` (id `257f6569-d17c-4464-be64-167dd1c22868`).