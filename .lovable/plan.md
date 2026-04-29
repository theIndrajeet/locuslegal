# Smarter answer matching — phonetic, fuzzy fillers, alias list

Three layered improvements on top of today's normaliser + edit-distance.

## 1. Typo-tolerant filler stripping

**Problem:** `ariticle 14` fails because the prefix-stripper only matches an exact `article`.

**Fix:** Before stripping, try fuzzy-matching the first token against the filler list (`article`, `section`, `schedule`, `clause`, `part`, `chapter`) using the same length-aware edit distance we already have. If the first token is within 1–2 edits of any filler word, treat it as that filler and strip it.

Catches: `ariticle`, `articel`, `artcle`, `schdule`, `schedual`, `secton`, `sectin`, `clase`, `chater`.

## 2. Metaphone phonetic fallback

**Problem:** Edit-distance can miss phonetic typos at word starts. `sertiorari` vs `certiorari` is 1 edit but in a long word, low signal. `habias` vs `habeas` similarly.

**Fix:** Add a tiny Double-Metaphone implementation (~80 LOC, no dep). After exact + edit-distance both fail, compare phonetic codes:
- `habeas` / `habias` / `habeus` → all encode to `HBS`
- `mandamus` / `mandamous` / `mandimus` → `MNTMS`
- `certiorari` / `sertiorari` / `certorari` → `SRTRR`
- `quo warranto` / `quo waranto` → `KW WRNT`

**Guard rails to prevent false positives:**
- Only apply phonetic match for tokens **≥ 5 characters** (skips short look-alikes like `or`/`of`)
- Multi-word answers must have the same number of tokens
- Phonetic codes must be **non-empty** (filters digits, which encode to `""`)

## 3. Per-question accepted aliases (admin escape hatch)

**Problem:** Some prompts are genuinely ambiguous. Algorithms can't catch every valid phrasing. Admins need a way to say "these are also correct".

**Fix:** No DB migration needed — the speed-round payload is already JSONB. Add an optional `aliases: string[]` field to each sub-question:

```ts
// Existing
{ id, prompt: "Writ for unlawful detention", answer: "habeas corpus" }
// New (backwards compatible — empty array if not provided)
{ id, prompt: "...", answer: "habeas corpus", aliases: ["HC writ", "writ of HC"] }
```

**Admin UI:** In `ChallengeForm.tsx`, under each speed-round answer field add a small "Accepted alternates (optional)" chip input. Empty = current behaviour.

**Grading:** A submission counts as correct if it matches `answer` **OR any alias** under the full normaliser → fuzzy → phonetic pipeline.

## How the four-layer pipeline runs (per submitted answer)

```text
1. Normalize submitted + each candidate (answer + aliases)
   - filler stripping (now fuzzy)
   - ordinals, word-numerals, romans
   - dashes, stop words, punctuation
2. Exact match? -> correct
3. Token-level edit distance within budget? -> correct
4. Token-level Metaphone match (tokens >= 5 chars)? -> correct
5. Otherwise -> wrong
```

## Files touched

**Client (preview grader)**
- `src/lib/bar/scoring.ts` — fuzzy filler stripping in `normalizeSpeedAnswer`, add `metaphone()` + `phoneticEquals()`, add aliases to `SpeedRoundPayload` type, update `gradeSpeedRound` to try `[answer, ...aliases]`

**Server (source of truth)**
- `supabase/functions/submit-bar-attempt/index.ts` — mirror the same three additions; extend `SpeedRoundPayloadSchema` to accept optional `aliases: string[]` per question

**Admin form**
- `src/components/admin-bar/ChallengeForm.tsx` — add an "Accepted alternates" chip-input under each speed-round answer; persist `aliases` into the payload when saving

**AI extraction (so AI-generated questions can suggest aliases)**
- `supabase/functions/extract-questions-from-pdf/index.ts` and `supabase/functions/draft-question-from-prompt/index.ts` — extend the JSON schema to optionally return `aliases` for speed-round questions; prompt the model to include common phrasings

**Tests**
- `src/lib/bar/scoring.test.ts` — add ~12 assertions: fuzzy filler stripping, phonetic matches (positive + negative), alias-list grading, regression that `or`/`of` still don't match

## Out of scope (deliberately)
- **Bag-of-words matching** — too risky, can match wrong-answer combinations
- **Abbreviation dictionary** (`SC` ↔ `Supreme Court`) — better expressed as per-question aliases
- **Compound numbers** (`twenty-one` → `21`) — extremely rare in speed-round answers, skip until requested
- **Diacritics stripping** — irrelevant to Indian legal vocabulary
