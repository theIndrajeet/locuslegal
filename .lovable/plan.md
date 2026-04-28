# Fix: Vacancy card stays "Draft application" after applying

## What's actually broken

I checked the database. The Lexmanus vacancy has `role = "Legal Intern"`, but your two logged applications have `role = "Legal Internship"`. The matching logic in `src/pages/Vacancies.tsx` requires **both** firm name AND role to match exactly, so the card never finds the application and stays in the `idle` state — that's why the UI doesn't change after you apply.

Two things caused this:

1. The Brief Builder lets the user edit the role free-text. When you drafted, the role got typed as "Legal Internship" instead of the vacancy's "Legal Intern".
2. The vacancy's actual role is never passed into the dialog as a hint, so the AI/user starts from a blank-ish guess.

## The fix

**1. `src/components/apply/DraftEmailDialog.tsx` — `DraftEmailTarget`**
- Add an optional `roleHint?: string | null` field on the target.
- When the brief is initialised (or when followup mode runs), prefer `target.roleHint` over a blank/auto guess so the logged role matches the vacancy.
- When inserting into `profile_applications`, also store the vacancy's role verbatim (use `target.roleHint ?? brief.role`) so future matches are exact.

**2. `src/pages/Vacancies.tsx`**
- Pass `roleHint: v.role` into the `draftTarget` so the draft starts from the correct role string.
- Loosen the matching in `refreshApplications`: match **by firm name only** when there's a single live vacancy from that firm; otherwise prefer exact role match, then fall back to a normalized contains match (`"legal intern"` ⊂ `"legal internship"`). This handles both the existing bad rows and any future drift.

**3. One-time data heal (no migration, just a normalization helper)**
- In the matching loop, after firm match, normalize both sides by lowercasing and stripping the suffix `"ship"`/`"s"` so `"Legal Internship"` ↔ `"Legal Intern"` resolves. This is a pure client-side compare, no DB write.

## What you'll see after the fix

- The Lexmanus card immediately flips to the "applied" treatment (accent ring, accent-tinted background, soft accent shadow) with the pill **"✓ Applied 28 Apr"** in the footer.
- The button becomes a disabled accent-outlined chip: **"✓ Follow up in 3d"**.
- After 3 days, that same button re-enables as **"⟲ Draft follow-up"** (white-on-yellow neobrutalist style) and opens the dialog directly into followup mode — no Brief Builder wizard, just the AI-generated 60–90 word nudge.
- The vacancy stays on the page (not hidden, not removed) — only the visual state changes.

No DB changes, no new migrations. Pure UI + matching-logic patch.