## Problem

`/admin/admins` shows "No admins (0)" and the network tab shows a 400 on `rpc/list_admins`. Postgres logs confirm:

> ERROR: structure of query does not match function result type

## Root Cause

Both `public.list_admins()` and `public.find_user_for_admin(p_query)` declare their `email` return column as `text`, but they `SELECT u.email FROM auth.users u`, where `auth.users.email` is `character varying`. Postgres rejects the row shape — nothing comes back, the UI sees zero admins, and the search box would also fail the moment anyone typed.

This is why Ritika (and every other scoped admin) doesn't appear in "Current Admins" even though her `opportunities_admin` row exists in `user_roles`.

## Fix

Migration that re-creates both functions with an explicit `u.email::text` cast. Bodies are otherwise unchanged — same security check (`is_admin(auth.uid())`), same scopes, same column order.

Functions to update:
- `public.list_admins()` — cast `u.email::text AS email`
- `public.find_user_for_admin(p_query text)` — same cast

No frontend changes needed. After the migration:
- Current Admins list will populate (you, Ritika, and anyone else with an admin-family role)
- The "Find a user" search will return results
- Granting/revoking already works (those RPCs return `void`, no shape issue)

## Technical notes

- Both functions stay `SECURITY DEFINER` with `search_path = public` and the existing `is_admin` gate.
- We're not touching `auth.users` or any reserved schema — only re-defining two `public` functions.
- No code, types, or RLS changes.
