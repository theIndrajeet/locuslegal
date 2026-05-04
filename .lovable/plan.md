# Fix: scoped admins blocked by edge function role checks

## What's happening

Ritika (`opportunities_admin`) clicked "Extract with AI" on the vacancy paste dialog and got **"Edge Function returned a non-2xx status code"**.

Root cause: every admin-gated edge function still does:
```ts
.from("user_roles").eq("role", "admin").maybeSingle()
if (!roleRow) return 403 Forbidden
```

We added scoped roles (`opportunities_admin`, `waitlist_admin`, `bar_admin`, `broadcast_admin`) to the database and to all the frontend RLS/UI checks — but the edge functions were missed. So scoped admins can see the buttons and pages, but every AI/admin function call 403s.

## Affected functions and required scope

| Function | Required scope |
|---|---|
| `extract-vacancy` | `opportunities_admin` (vacancies live under Opps) |
| `extract-opportunity` | `opportunities_admin` |
| `extract-questions-from-pdf` | `bar_admin` |
| `draft-question-from-prompt` | `bar_admin` |
| `suggest-topics` | `bar_admin` |
| `send-broadcast` | `broadcast_admin` |

In every case, full `admin` should also pass (already does, since they have the `admin` row).

## Plan

1. **Replace the inline role check** in each function above with a call to the existing `has_admin_scope(uid, scope)` Postgres function we created in the prior migration. Using the RPC keeps the logic in one place and matches the RLS policies.

   New shared pattern (per function, with the appropriate scope literal):
   ```ts
   const { data: ok } = await adminClient.rpc("has_admin_scope", {
     uid: userId,
     scope: "opportunities_admin",
   });
   if (!ok) return json(403, { error: "Forbidden" });
   ```

2. **No DB migration needed** — `has_admin_scope` already exists and already treats full `admin` as passing every scope.

3. **No frontend changes** — the dialogs, buttons and routing already gate on `hasScope(...)` and will simply start working once the edge functions stop 403'ing.

4. **Verify** by having (or simulating as) Ritika hit "Extract with AI" on the vacancy paste dialog after deploy; should return parsed JSON instead of the toast error.

## Out of scope

- No new roles, no new UI, no schema changes.
- Bar admin AI tools and broadcast send are fixed in the same pass for consistency, even though Ritika doesn't use them — otherwise the next scoped admin we onboard hits the same wall.
