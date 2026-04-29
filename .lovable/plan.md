# Smart answer matching — typos, equivalents, everywhere

## What's already done
The previous fix made these all count as the **same answer** in Speed Round (both client preview and server grading):

- `8`, `8th`, `eighth`, `VIII`, `viii`
- `Article 14`, `article 14`, `14`, `Art. 14`
- `Schedule VIII`, `Schedule 8`, `Schedule eighth`

## What this round adds

The user wants the matcher to also forgive **typos** and apply consistently across the whole app.

### 1. Typo tolerance (Levenshtein, length-aware)

Add fuzzy matching on top of the existing `normalizeSpeedAnswer()`:

- After normalisation, if exact match fails, compute **Damerau-Levenshtein distance** between submitted and expected.
- Allowed edit distance scales with length:
  - ≤ 3 chars: must match exactly (avoid false positives on "or" vs "of")
  - 4–6 chars: 1 edit allowed (`habeus` → `habeas`)
  - 7–10 chars: 2 edits (`mandamuss` → `mandamus`)
  - 11+ chars: 3 edits (`fundemental rite` → `fundamental right`)
- Applies **per token** for multi-word answers, then re-joins. So `"writ of habeus corpos"` matches `"writ of habeas corpus"`.

This catches: `ariticle`, `schdule`, `habeus`, `manadmus`, `fundemental`, `direcive`, `principels` — i.e. genuine typos, without over-matching genuinely different answers.

### 2. Numeric/filler tolerance everywhere
The existing normaliser already handles ordinals, word-numerals, roman numerals, and filler prefixes. We extend it to also:

- Strip trailing punctuation (`"Article 14."` → `"14"`)
- Collapse multiple spaces / non-breaking spaces
- Treat `–` `—` as `-` (em/en dashes)
- Ignore the words `the`, `of`, `a`, `an` when comparing multi-word answers (so `"the right to equality"` matches `"right to equality"`)

### 3. Audit: where does free-text grading happen?

Verified: free-text answers exist in **exactly one place** — Speed Round (`SpeedRoundRenderer` → `gradeSpeedRound`). All other Bar question types (MCQ, Issue Spotter, Jurisdiction, Document Review, Brief Builder, Ethics, Client Counseling) are **ID/option based** — there is no text to normalise.

So "throughout the app" boils down to: keep the normaliser as the single source of truth, called from the only two graders that exist for free text:

```text
src/lib/bar/scoring.ts                         (client preview)
supabase/functions/submit-bar-attempt/index.ts (server, source of truth)
```

Both already share the same normaliser. The new fuzzy logic will be added to **both**, kept in lockstep.

### 4. Tests

Extend `src/lib/bar/scoring.test.ts` with cases for:
- Typos: `habeus corpus` → `habeas corpus`
- Punctuation: `Article 14.` → `14`
- Stop words: `the right to equality` → `right to equality`
- Negative cases: `or` does **not** match `of`; `eighth` does not match `seventh`

## Files touched
- `src/lib/bar/scoring.ts` — extend `normalizeSpeedAnswer`, add `fuzzyEquals(a, b)`, plug into `gradeSpeedRound`
- `supabase/functions/submit-bar-attempt/index.ts` — mirror the same two helpers
- `src/lib/bar/scoring.test.ts` — add ~15 new assertions

## Out of scope
- Allowing one-character answers to match across letters (intentional — too risky)
- Synonyms / semantic matching (e.g. "SC" vs "Supreme Court") — that needs an admin-curated alias list, separate task
- Changing how MCQ / option-based questions grade (no text involved)
