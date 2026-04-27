# Make the Beta Page Universal — One Link, Personal for Everyone

Right now `/beta` only works for the 7 hardcoded testers via unique codes. We'll convert it into a **single shareable link** where any visitor:

1. Enters their name (or signs in)
2. Gets auto-assigned the next Founding Tester slot (#001 → #007, then #008+ as "Wave 2")
3. Sees a personalized cinematic intro and a rotating message (so the experience still feels custom)
4. Chooses whether to appear publicly on the Founding Tester board

No more per-person links. One URL: `https://locus.legal/beta`.

---

## What testers will see

```text
1. Land on /beta (no code needed)
   ┌────────────────────────────────────┐
   │  CLOSED BETA · Founding Testers    │
   │                                    │
   │  Your name *      [_____________]  │
   │  Email (optional) [_____________]  │
   │  ─ or ─                            │
   │  [ Sign in with Google ]           │
   │                                    │
   │  ☑ Add me to the public            │
   │    Founding Tester board           │
   │                                    │
   │  [ Claim my slot → ]               │
   └────────────────────────────────────┘

2. Cinematic intro (personalized)
   "Welcome, {name}."
   "You're Founding Tester #{N}."
   "{rotating line — 1 of ~8}"
   [ Begin · 30 minutes ]

3. The 24-task checklist (unchanged)
   + sticky "Founding Tester #{N}" badge
   + live roster sidebar showing how many have submitted

4. Submit → completion screen with shareable badge
```

### Rotating intro lines (random per visitor, so each feels different)
- "Locus is in your hands for the next 30 minutes."
- "You're seeing this before the world does."
- "Your notes shape the launch. No filter."
- "Built for law students. Tested by you first."
- "Seven plus you. The bench is open."
- "Break it. We'd rather know now."
- "First in. Last to leave the credits."
- "Founding means founding. Forever."

---

## What changes in the database

**`beta_testers` table** — keep, but make it grow:
- Drop the `code` requirement — codes become optional / nullable (existing 7 keep theirs)
- Add `claimed_at`, `email`, `user_id` (nullable, FK-free per house style), `is_public` (boolean, default false)
- Add `intro_line_index` (small int) so the same person sees the same line on revisit
- `slot_number` auto-increments on claim (next available)

**`beta_feedback` table** — already has `tester_id` + `tester_code`. No schema change.

**New RPC: `claim_beta_slot(p_name text, p_email text, p_user_id uuid, p_is_public bool)`**
- Inserts a new row with `slot_number = (max(slot_number) + 1)`
- Picks a random `intro_line_index`
- Returns the full tester row (id, slot, intro line, etc.)
- `SECURITY DEFINER` so anonymous visitors can claim

**RLS updates**
- `beta_testers` SELECT: only return rows where `is_public = true` to anonymous visitors (so the public board stays clean), full read for admin
- INSERT via the RPC only

---

## What changes in the page

**`src/pages/BetaChecklist.tsx`** — rewritten flow:
1. **Claim screen** (new) — name input, optional email, optional Google sign-in, "Add me to public board" checkbox, single "Claim my slot" button.
2. **Cinematic intro** — uses returned `slot_number` and `intro_line_index` from the RPC. Same as today, but driven by claim response instead of `?code=`.
3. **Checklist** — unchanged. Drafts are saved to `localStorage` keyed by the new `tester_id` (UUID), not the old code.
4. **Roster sidebar** — shows the *public* Founding Testers (those who opted in) + a count of total claimed/submitted. Hides anyone who chose privacy.
5. **Returning visitor** — if `localStorage` has a `tester_id`, skip the claim screen and resume.

The 7 existing hardcoded entries keep working — their links still resolve, they keep their slot numbers (1-7).

**`src/pages/AdminBeta.tsx`** — small additions:
- Roster table now shows: slot, name, email, public Y/N, claimed_at, submitted_at
- Drop the "Copy 7 links" button — replaced with a single "Copy /beta link" button
- Keep CSV export

---

## Out of scope (easy follow-ups)
- Showing the Founding Tester badge on the user's public profile (needs login to be required — you've already said skip for now)
- Capping at e.g. 50 founding testers (trivial check in the RPC)
- Email notification on each claim

---

## Files touched
- `supabase/migrations/<new>.sql` — alter `beta_testers`, add `claim_beta_slot` RPC, update RLS
- `src/pages/BetaChecklist.tsx` — new claim flow + resume-from-localStorage
- `src/pages/AdminBeta.tsx` — roster columns, single-link copy
- `src/content/beta-checklist.ts` — add `INTRO_LINES` constant (rotating messages)
