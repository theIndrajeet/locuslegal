
# Cover Letter Engine v2 — Indian-recruiter rules baked in

The drafter currently produces decent generic emails. The uploaded knowledge base shows that's exactly the failure mode Indian recruiters reject in 8 seconds. This upgrade rebuilds the prompt + adds a hard validator so we're "structurally allergic" to ChatGPT prose.

## What changes for the user

1. **Step 1 of the brief becomes recipient-type aware.** A new "What kind of recipient is this?" chip row appears above the existing "What draws you to them?" row, auto-detected from `target.kind` + `target.type` (firm tier, boutique, chamber, in-house, NGO, judicial, regulator, legal-tech). User can override. This drives template selection on the backend.
2. **Non-NLU overlay (silent).** If the user's college isn't in the NLU whitelist, the backend silently activates the overlay — no apologetic prose, lead with quantified work, never mentions "despite/although/non-NLU".
3. **British English everywhere.** All output forced to British spelling.
4. **Hard blocklists enforced after generation.** If the draft contains any AI-tell (delve, tapestry, leverage, robust, ever-evolving, "I hope this email finds you well", "express my keen interest", etc.), Indianism (kindly do the needful, esteemed, prestigious, revert back, myself X), or apologetic non-NLU phrasing, the server auto-regenerates once with a "you produced X — rewrite without it" follow-up. After two failed attempts it returns the cleanest version with a soft warning toast.
5. **Structural checks.** Reject drafts with >1 em-dash, three equal-length paragraphs, tricolons of adjectives, or sentence-length stdev <6 words. Same auto-retry loop.
6. **Subject line format.** Switches from "Application for Legal Internship — Name" to the Indian convention: `Internship Application – [Month YYYY] – [Practice/Office]` when availability + practice are known; falls back to existing format otherwise.
7. **Length tightened.** 120–180 words (was 110–180), hard cap 200 in email body. Recipient-type-specific tweaks (chambers 100–150w, NGOs 250–400w when we eventually add the form mode).
8. **CGPA rule.** Backend includes CGPA only if ≥7.0/10 and always with the scale. Below that, omitted from the letter even if user added it as a highlight chip.

## What does NOT change (out of scope for this pass)

- No PDF/letterhead "formal mode" yet (Vidhi/PRS/SEBI portals). That's a separate flow needing form fields per programme.
- Decision-tree secondary modifiers like off-season timing recommendations, judge-name auto-citation, or referral opener — these need data we don't have on the target.
- The 4-step brief wizard UI keeps its current structure; only Step 1 gets the recipient-type chip row added.

## Technical implementation

### `supabase/functions/draft-application-email/index.ts`

Rewrite `SYSTEM_PROMPT` to encode:
- Recipient-type matrix (10 templates: tier1_firm, tier2_firm, ip_boutique, tax_boutique, disputes_boutique, sc_chamber, hc_chamber, inhouse_corporate, inhouse_tech, legaltech_startup) with per-type tone, salutation, sign-off, length, must-include, must-avoid drawn from §A4 of the brief.
- Non-NLU overlay rules (§A8): never use despite/although/non-NLU/tier-2; lead with verifiable achievement; quantify everything.
- AI-tell blocklist (§A9 Tier 1, ~40 phrases) + Indianism blocklist (§A10) — passed to the model as a "DO NOT WRITE" list.
- British English mandate (§A1.6).
- Specificity requirement: if no firm-specific reference is available (no practice_areas, no recent matter, no sector), fall back to the source-led opener pattern from §A5 instead of inventing.

Add new inputs to the request `Body`:
- `recipient_type` (enum): tier1_firm | tier2_firm | ip_boutique | tax_boutique | disputes_boutique | sc_chamber | hc_chamber | inhouse_corporate | inhouse_tech | legaltech_startup. Default inferred from `target.kind` + `target.type`.
- `user.cgpa` (number | null) — currently dropped, needed for CGPA gate.
- `user.is_nlu` (boolean) — computed client-side from a hard-coded NLU list.

Add `validateDraft(subject, body)` function that runs after the AI call:
- Lowercase scan against the blocklist (~50 phrases). Returns `{ ok: false, hits: [...] }` if any hit.
- Em-dash count: >1 → fail.
- Sentence split, count adjective tricolons via regex (`\b\w+, \w+,? and \w+\b` near adjective stems) → fail.
- Paragraph word counts — if 3+ paragraphs and stdev of word counts <8 → fail.
- American spelling check (organize/organized/customize/realize/optimization/color/center/behavior) → fail.

If `validateDraft` fails:
- First failure → re-invoke the AI gateway with an appended user message: `"Your previous draft contained: [list]. Rewrite the entire email without those phrases or patterns. Keep the same structure."` Return that.
- Second failure → return the second draft anyway with a `warnings: string[]` field in the response.

Surface `warnings` in the dialog as a small amber chip above the draft so the user knows to skim for issues.

### `src/components/apply/DraftEmailDialog.tsx`

- Add a hard-coded `NLU_COLLEGES` list (~22 entries, normalized lowercase fuzzy match on `user.college`) and compute `is_nlu` to send in the payload.
- Add `RECIPIENT_TYPE_OPTIONS` constant + chip row at the top of Step 1 ("This is a…") with auto-default. Persist in `BriefState` as `recipient_type`.
- Pass `recipient_type`, `user.cgpa`, `user.is_nlu` in `payload`.
- Render `warnings` (if returned) as an amber-bordered note above the Subject field.

### Memory

After implementation, save:
- `mem://features/cover-letter-engine` — recipient-type matrix, blocklist source of truth, non-NLU overlay rules, validator behaviour. So future iterations don't drift.

## Files touched

- `supabase/functions/draft-application-email/index.ts` (major rewrite of prompt + new validator)
- `src/components/apply/DraftEmailDialog.tsx` (add NLU detection, recipient-type step, warnings UI, send cgpa)
- `mem://features/cover-letter-engine` (new memory)
- `mem://index.md` (add reference)

## Risks / trade-offs

- **Two-pass generation doubles cost on bad drafts.** Acceptable: better drafts > saved tokens, and Gemini Flash is cheap.
- **Aggressive blocklist may reject borderline-fine prose.** We start with the §A9 Tier-1 list only (high precision); skip Tier-2 transitions (Furthermore/Moreover) for now to avoid over-rejection. Can tighten later.
- **Recipient-type detection from `target.type` is fuzzy.** We default conservatively (firm → tier2_firm unless name matches a known Tier-1 list) and let the user override via the chip row — so wrong defaults are a one-tap fix, not a silent bug.
