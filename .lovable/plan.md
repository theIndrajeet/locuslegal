## Goal

Add scoped admin roles so I can grant narrow access (e.g., Ritika gets Opportunities-only). Full `admin` continues to imply all scopes. Then grant Ritika `opportunities_admin`.

## Roles

Add four values to the `app_role` enum:

- `opportunities_admin` — manage vacancies, CFPs, moots, competitions
- `waitlist_admin` — view waitlist + manage firm suggestions
- `bar_admin` — manage Bar challenges, sources, AI generations, attempts cleanup
- `broadcast_admin` — draft and send email broadcasts

Existing `admin` is unchanged and implicitly grants every scope.

## Database

**Migration 1 — enum + helpers**
- `ALTER TYPE app_role ADD VALUE` for the four new roles.
- New SECURITY DEFINER `has_admin_scope(uid uuid, scope app_role)` that returns true if the user has `admin` OR the specific scope. Used by every RLS policy below.

**Migration 2 — rewrite RLS to use `has_admin_scope`**
- `vacancies`, `cfps`, `moots`, `competitions` (insert/update/delete/admin-select) → `has_admin_scope(uid, 'opportunities_admin')`
- `update_broadcasts` → `has_admin_scope(uid, 'broadcast_admin')`
- `firm_suggestions` (admin select/update/delete) → `has_admin_scope(uid, 'waitlist_admin')`
- `bar_challenges`, `bar_sources`, `bar_ai_generations`, `bar_attempts` (delete) → `has_admin_scope(uid, 'bar_admin')`
- All other admin tables (beta, user_roles, etc.) stay on `is_admin()` — only full admins manage those.

**Migration 3 — RPCs**
- `find_user_for_admin(p_query)` → return `roles text[]` per user instead of `is_already_admin boolean`.
- `list_admins()` → return one row per user with `roles text[]` aggregated.
- Replace `grant_admin_role(p_user_id)` with `grant_role(p_user_id, p_role app_role)` — only callers with full `admin` can call; only the five admin-family roles are accepted.
- Replace `revoke_admin_role(p_user_id)` with `revoke_role(p_user_id, p_role app_role)` — same gate; refuse self-revoking the last `admin` role.

## Frontend

**Hook**
- `useAdminRole` returns `{ isAdmin, scopes: AppRole[], hasScope(scope) }`. `isAdmin` stays true only for full admins; `hasScope` checks `isAdmin || scopes.includes(scope)`.

**Layout / nav**
- `AdminLayout` allows entry if user has *any* admin scope; per-route guards live inside each page.
- `AdminSidebar`, `AdminSubNav`, `AdminDashboard` tiles — filter visible items by `hasScope`. A `waitlist_admin` only sees Waitlist + Firm Suggestions.

**Per-page guards**
- `AdminVacancies`, `AdminOpportunities` → require `opportunities_admin`
- `AdminWaitlist`, `AdminFirmSuggestions` → require `waitlist_admin`
- `AdminBar` → require `bar_admin`
- `AdminBroadcasts` → require `broadcast_admin`
- `AdminBeta`, `AdminAdmins` → require full `admin`

Pages without the right scope render the existing "Access Denied" pattern.

**`AdminAdmins` redesign**
- Search result row: a row of toggle chips `[Full Admin] [Opportunities] [Waitlist] [Bar] [Broadcasts]`. Click toggles that role on/off via `grant_role` / `revoke_role`.
- Current admins list: each row shows the person's role chips inline with the same toggles.
- Self-cannot-revoke guard for `admin` only (you can swap your own scoped roles freely).
- Page itself is gated to full `admin`.

## Data action

After migrations land, insert one row:
```
INSERT INTO user_roles (user_id, role)
VALUES ('257f6569-d17c-4464-be64-167dd1c22868', 'opportunities_admin')
```
Ritika (`ritikaraj915`) then sees `/admin` with only the Opportunities tile/nav and can post vacancies, CFPs, moots, and competitions. She cannot see waitlist, beta feedback, Bar internals, broadcasts, or the Admin Access page.

## What I will NOT do

- Will not change anything about your full `admin` access.
- Will not add per-resource ownership ("can only edit her own vacancies").
- Will not add audit logging of grants/revokes (easy to add later if you want).
- Will not touch the existing `is_admin()` function — scoped checks use the new helper, full-admin-only tables keep using `is_admin()`.

## Files

- New migration (3 statements above).
- `src/hooks/useAdminRole.ts` — return scopes.
- `src/components/admin/AdminLayout.tsx` — broaden gate.
- `src/components/admin/AdminSidebar.tsx`, `AdminSubNav.tsx`, `AdminTiles.tsx` — filter by scope.
- `src/pages/AdminDashboard.tsx` — filter tiles.
- `src/pages/AdminAdmins.tsx` — chip-based grant/revoke UI.
- Per-page scope guards in `AdminVacancies.tsx`, `AdminOpportunities.tsx`, `AdminWaitlist.tsx`, `AdminFirmSuggestions.tsx`, `AdminBar.tsx`, `AdminBroadcasts.tsx`, `AdminBeta.tsx`.
- `src/integrations/supabase/types.ts` regenerates automatically.
