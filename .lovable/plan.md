# Brief Builder — 4-step guided wizard for sharper email drafts

Replace the single "extra notes" field in the Draft Email dialog with a 4-step wizard that gathers richer context, then feeds it as a structured `brief` object to the AI for a stronger, more personalised draft.

## Wizard steps

**Step 1 — Fit (why them)**
1. What draws you to them? (single-select chips: Practice area match · Reputation · Location · Recent matter · Other)
2. Specific role/team? (text, prefilled "Legal Internship")

**Step 2 — Logistics**
1. Availability (chips: This summer · Winter break · Specific months → reveals text input · Flexible)
2. Duration (chips: 2–4 weeks · 1 month · 2 months · 3+ months)

**Step 3 — Edge**
1. One line they should remember about you (text, 140 chars)
2. Mode (chips: In-office · Remote · Hybrid · Either)

**Step 4 — Highlights from your CV** (multi-select, max 4)
Auto-generated chips from the user's profile data:
- One chip per past internship (e.g. "IP research at Scriboard") built from `firm_name` + key noun from `description`
- One chip per matching subject_of_interest that overlaps with target's practice_areas/legal_needs/sector (label flagged with "matches their practice")
- Education chip: "BBA LLB, KIIT School of Law"
- Moots / Publications chips (queried from `profile_moots` and `profile_publications`)
- CGPA chip if set and ≥ 7.5
Smart defaults: pre-tick the 2–3 with strongest target overlap. Cap at 4 total selections.

## UX

- Big "1 — 2 — 3 — 4" progress indicator, neobrutalist chips matching existing Tone toggle style.
- Back / Next buttons; "Skip & generate" link visible from any step.
- Final step's primary CTA becomes "Generate email" (replaces the standalone Generate button).
- All steps optional; unanswered = omitted from prompt.
- Per-target cache extended to also remember brief answers within the session.

## Backend

`supabase/functions/draft-application-email/index.ts`:
- Accept new optional `brief` object: `{ fit_reasons, availability, duration, signature_line, work_mode, highlights: [{ kind, label, detail }] }`.
- Validate and sanitise (length caps, kind enum).
- Extend system prompt with a "USING THE BRIEF" section instructing the model to: lead opening with strongest fit_reason, weave availability+duration into closing, place signature_line as the strongest middle-paragraph sentence, weave highlights naturally (no bullets), prioritise the highlight whose detail overlaps most with target.
- Include `brief` in the user prompt JSON if present.
- Backwards compatible: empty brief → current generic generation.

## Data fetch (client)

Extend the dialog's profile load to also fetch:
- `profile_moots` (id, competition_name, year, role, result) — top 3 by year DESC
- `profile_publications` (id, title, publisher, publication_date) — top 3 by date DESC

(Profile, internships, subjects, cgpa already fetched.)

## Files

- `src/components/apply/DraftEmailDialog.tsx` — replace inline form with `<BriefStepper />` (kept inline; ~250 lines)
- `supabase/functions/draft-application-email/index.ts` — accept and use `brief`

Backwards compatible; no DB changes.
