# Smart duplicate detection for the vacancy drafter

Right now an admin can post the same vacancy twice without any guardrail. Goal: detect likely duplicates and surface them clearly — both **as soon as the AI fills the form** and **right before saving** — with an explicit "Post anyway" override for the rare legitimate case.

## What counts as a duplicate

A new vacancy is flagged if **any** existing live or recently-archived vacancy (last 30 days) matches on:

1. **Hard match** (almost certainly the same): same `application_email` (case-insensitive) **and** same normalized `firm_name`. → Treat as a strong duplicate.
2. **Soft match** (likely the same posting): same normalized `firm_name` **and** similar `role` (token-overlap ≥ 70% after lowercasing, stripping punctuation, removing filler words like "intern", "associate", "trainee", "law", "the").
3. **Email reuse** (worth a heads-up): same `application_email` for a **different** firm in the last 30 days. Shown as a soft note, not a block.

Normalization for firm name: lowercase, strip `&`, `,`, `.`, `llp`, `llc`, `partners`, `co`, `advocates`, collapse whitespace.

## UX

**On paste-extract success** (`AdminVacancyDialog`, after the AI fills fields):
- Run the duplicate check immediately.
- If a hard or soft match is found, replace the green success toast with an amber warning toast: *"Looks like a duplicate of {firm} — {role}, posted {N}d ago. Review before saving."*
- Show a persistent inline banner at the top of the form (yellow neobrutalist card, `AlertTriangle` icon) listing up to 3 matched vacancies with: firm, role, posted date, status (live/archived), and an "Open" link (new tab to `/admin/vacancies`).

**On save click**:
- Re-run the check against the *current* form values (in case admin edited firm/email/role after extraction).
- If a hard match exists → block save, show a confirm dialog: *"This looks identical to an existing vacancy ({firm} — {role}, {status}, posted {N}d ago). Posting again will create a duplicate on the board."* with two buttons: **Cancel** (default) and **Post anyway**.
- If only a soft match → allow save but show the warning banner; no blocking dialog.
- Email-reuse-different-firm → never blocks, just shown as an info chip in the banner.

**Edit mode**: exclude the row currently being edited (`initial.id`) from the duplicate set so editing a vacancy never flags itself.

## Technical plan

**1. New helper `src/lib/vacancy-dedupe.ts`**
- `normalizeFirmName(s: string): string`
- `roleSimilarity(a: string, b: string): number` — Jaccard on filtered tokens
- `findDuplicates(candidate, existing[], excludeId?)` → returns `{ hardMatches: Vacancy[], softMatches: Vacancy[], emailReuse: Vacancy[] }`
- Pure functions, easy to unit-test.

**2. Fetch helper in the dialog**
- Add `loadRecentVacancies()` inside `AdminVacancyDialog.tsx` that queries:
  ```
  supabase.from("vacancies").select("id,firm_name,role,application_email,status,posted_at,expires_at")
    .or("status.eq.live,and(status.eq.archived,expires_at.gt.<30d-ago>)")
    .limit(500)
  ```
- Cache the result in a `useRef` for the lifetime of the dialog open (refresh on each open).

**3. `AdminVacancyDialog.tsx` changes**
- New state: `dupes: { hardMatches, softMatches, emailReuse }` and `confirmOpen: boolean`.
- After `extract()` succeeds → run dedupe → setDupes → toast accordingly.
- Live re-check via `useMemo` whenever `firm_name`, `role`, or `application_email` change in the form (debounced is fine but not required at admin scale).
- Render `<DuplicateBanner />` above the form fields when `dupes` has anything.
- In `submit()`: if `hardMatches.length > 0` and not yet confirmed → open `AlertDialog` instead of inserting. The "Post anyway" button calls the existing insert path with a `forceOverride` flag set.
- Edit mode passes `initial.id` to `findDuplicates` to exclude self.

**4. New component `src/components/vacancies/DuplicateBanner.tsx`**
- Yellow neobrutalist card (`border-2 border-foreground bg-accent/10 shadow-[3px_3px_0_0_hsl(var(--foreground))]`), `AlertTriangle` icon, headline + 1–3 match rows with firm, role, "{N}d ago", status pill, and external-link icon to `/admin/vacancies`. No emojis (per project rules).

**5. Confirm dialog**
- Use `AlertDialog` from `@/components/ui/alert-dialog` with `Cancel` (default) and a destructive-styled `Post anyway` action.

## Out of scope

- No DB migrations or unique constraints (a hard DB constraint would block legitimate re-posts and rotating-email firms; soft-warning UX is the right level).
- No changes to the public `/vacancies` board, the `extract-vacancy` edge function, or the Opportunities admin (CFPs/moots/competitions).
- No dedupe for the Opportunities board — can be a follow-up if useful.

## Files touched

- `src/lib/vacancy-dedupe.ts` (new)
- `src/components/vacancies/DuplicateBanner.tsx` (new)
- `src/components/vacancies/AdminVacancyDialog.tsx` (fetch + check + banner + confirm-on-save)