# Directory v2: two tabs + student suggestions loop

## Part 1 — Two-tab Directory (recap)

Under the Firms/Startups toggle, add a second segmented control:

```
[ Mail Now · 885 ]   [ Cold Call · 3,529 ]
```

- **Mail Now** — firms with a public email (default tab).
- **Cold Call** — firms with phone only.
- A separate **"Verified"** chip (45 firms) cuts across both tabs.
- Firm cards show `Mail` icon (Mail Now) or `Phone` icon (Cold Call); verified firms get a `ShieldCheck` accent pill.

### Data merge (one-off)
Regenerate `src/data/firms.json` from the spreadsheet:
1. Pull all 4,414 rows from **Full Database**.
2. Clean Google Maps junk (cut at first `|` or capital-`I`-prefix; "Bhardwaj & AssociatesIDivorce lawyer..." → "Bhardwaj & Associates").
3. Attach `verified: "verified" | "likely"` + `verificationNote` from **Priority Targets** (45 verified, 246 likely).
4. Override email from **Outreach Tracker** (37 hand-checked) when present.
5. Add `channel: "email" | "phone"` for tab routing.
6. Drop rows with neither email nor phone.
7. Add stable `id` (slug of name+city) so suggestions can target a specific firm.

### FirmDrawer
- Verification badge under tier chip with note tooltip.
- `phone` channel: highlight phone, hide empty email field.
- `email` channel: prominent "Send cold email" CTA → existing Cold Email playbook.

### Stats copy
Hero / StatsBar: **"4,400+ law firms · 880+ direct emails · 45 independently verified"**.

---

## Part 2 — Student suggestions (the new bit)

### Why this matters
Students on the ground know which emails bounce and which firms got promoted. Crowdsourcing fixes makes the directory self-improving and "factual over time".

### Database — new table
```sql
create table public.firm_suggestions (
  id uuid primary key default gen_random_uuid(),
  firm_id text not null,            -- the slug from firms.json
  firm_name_snapshot text not null, -- denormalised for admin readability
  firm_city_snapshot text,
  user_id uuid references auth.users(id) on delete set null,
  field text not null check (field in ('email','tier','phone')),
  current_value text,               -- what we currently show
  suggested_value text not null,    -- what the student proposes
  evidence text,                    -- optional note ("reply bounced", "got reply from this address")
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create index on public.firm_suggestions (status, created_at desc);
create index on public.firm_suggestions (firm_id);

alter table public.firm_suggestions enable row level security;
```

**RLS policies**
- `INSERT` — any authenticated user (one row at a time, validated client-side).
- `SELECT own` — users see their own pending suggestions (so they know it was submitted).
- `SELECT all` / `UPDATE` / `DELETE` — admins only via `is_admin(auth.uid())`.

### UI — student side (FirmDrawer)
Add a small **"Suggest a fix"** link at the bottom of the drawer → opens a compact dialog with:
- Field selector (radio): **Email is wrong** / **Tier is wrong** / **Phone is wrong**
- Current value (read-only, prefilled)
- Suggested value (text input, validated by field type — email regex / tier enum / phone format)
- Evidence (optional textarea, 280 char max, e.g. "Bounce report from Gmail" / "Reply received from this address")
- Submit → toast "Thanks, we'll review it." Auth-gated (redirect to login if signed-out, like vote button).

Rate limit (client + server): max 5 pending suggestions per user per 24h to deter spam.

### UI — admin side (`/admin/firm-suggestions`)
New page in the admin hub. Table view:

| Firm | Field | Current → Suggested | Evidence | By | When | Actions |
|---|---|---|---|---|---|---|

- Filters: `pending` (default) / `accepted` / `rejected`; field type; city.
- Each row has **Accept**, **Reject**, and a small note input.
- **Accept does NOT auto-edit `firms.json`** (it's a static file). Instead:
  - Marks status `accepted` + records `admin_note`.
  - Copies the suggested value to the clipboard.
  - Shows a "Apply to firms.json" hint with the firm slug, so I (the AI) can do a one-shot batch update next time you ask.
- Add a tile to the existing Admin Dashboard: "Firm suggestions · {pending count}".

### Files touched

**New**
1. `supabase/migrations/<ts>_firm_suggestions.sql` — table + RLS
2. `src/pages/AdminFirmSuggestions.tsx` — admin review UI
3. `src/components/directory/SuggestFixDialog.tsx` — student-facing form

**Edited**
4. `src/data/firms.json` — regenerated with verification + channel + slug
5. `src/pages/Directory.tsx` — Mail Now / Cold Call tabs, Verified chip, default sort
6. `src/components/FirmDrawer.tsx` — verification badge, channel CTAs, "Suggest a fix" trigger
7. `src/components/CompareBar.tsx` — Verified column
8. `src/components/Hero.tsx` (and StatsBar if used) — updated stats
9. `src/components/admin/AdminTiles.tsx` + `AdminSidebar.tsx` — add Firm Suggestions entry
10. `src/pages/AdminDashboard.tsx` — pending-count stat
11. `src/App.tsx` — route `/admin/firm-suggestions`
12. `mem://features/directory-page` — note tabs + suggestions

## Out of scope
- Auto-applying accepted suggestions to `firms.json` (manual batch step — safer).
- Public "votes" on suggestions.
- Startups data (unchanged).

Approve and I'll execute the migration, merge, UI build, and admin page in one pass.
