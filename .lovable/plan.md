

## Plan: Add Pixelated Visit Counter to Footer

### What
A minimal, retro-digital visit counter in the footer branding section — styled like an old-school pixel/LCD hit counter with a semi-blurred glow effect. It will track total page visits persistently in the database.

### Database
- Create a `visit_counter` table with a single row: `id` (int, default 1), `count` (bigint, default 0).
- Seed it with one row.
- RLS: allow anonymous `SELECT`; use a database function `increment_visit_count()` (security definer) to atomically increment — no direct update needed from the client.

### Component: `src/components/VisitCounter.tsx`
- On mount, call the `increment_visit_count` RPC which returns the new count.
- Render each digit as a separate block using a pixel/monospace font (`font-mono`).
- Style: dark translucent background, subtle blue/cyan glow (`text-shadow` + `backdrop-blur`), slight border, zero-padded to 6+ digits.
- Tiny label underneath: "visitors" in muted small text.
- CSS gives a pixelated, LCD look using `font-feature-settings: "tnum"` and stepped letter-spacing.

### Footer Integration: `src/components/Footer.tsx`
- Import and place `<VisitCounter />` in the branding row, between the logo and copyright — or centered below the founder note.

### Files Changed
1. **New migration** — `visit_counter` table + `increment_visit_count()` function
2. **New** `src/components/VisitCounter.tsx`
3. **Edit** `src/components/Footer.tsx` — add the counter

