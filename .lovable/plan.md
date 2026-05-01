# Replace Footer Arcade with "Objection!" — a daily legal Wordle

Swap the bulky 24-card memory game for a compact, neobrutalist daily word game themed around legal vocabulary. One puzzle per day, 6 guesses, 5-letter legal terms only. Becomes a daily habit hook and reclaims footer real-estate.

## The game (rules)

- **Word**: a 5-letter legal term, same for everyone, rotates daily (UTC).
- **Guesses**: 6 attempts. Each must be a valid 5-letter legal word from our list (rejects gibberish — shake animation).
- **Tile states** after each guess (Wordle-standard):
  - **Correct letter, correct spot** → Yellow fill, black text, hard shadow.
  - **Correct letter, wrong spot** → White outline, white text.
  - **Not in word** → Muted dark fill, dimmed text.
- **Keyboard**: on-screen QWERTY beneath the grid, keys recolor as letters are tried. Physical keyboard also works.
- **Win**: reveal answer + flavor line ("Sustained.") + share button copying a spoiler-free emoji-grid… wait — **no emojis allowed per project rules**. Use ASCII blocks instead: `■` (correct), `□` (present), `·` (absent). Example share text:
  ```
  Objection! #042  4/6
  ·□··· 
  □·□·· 
  ■■···
  ■■■■■
  ```
- **Loss**: reveal answer + flavor line ("Overruled.") + share button.
- **Persistence**: today's progress + history saved in `localStorage` (no auth required, no backend). Returning the same day shows the completed board, not a fresh puzzle.
- **Streak counter**: small "Streak: 3" indicator next to title.

## Visual / layout

- Compact, centered, max-width ~420px. No more 960px-wide grid.
- **Header strip**: `Objection!` (Sora extrabold, yellow `us` accent on the `!`? — actually keep it plain to avoid logo-confusion; just bold black/white). Right side: `#042  ·  Streak 3` in mono.
- **Grid**: 6 rows × 5 tiles. Each tile 56px square, 3px black border, 4px hard shadow when filled, flip-reveal animation per tile (staggered 100ms).
- **Keyboard**: 3 rows, neobrutal keys with 2px borders + 2px shadow. Backspace + Enter as wider keys.
- **Below**: muted hint line — "Today's word is a 5-letter legal term." No category leak.
- Section bg stays `bg-background`. Title sits where the old "Welcome to the footer arcade" was.

## Word list

Curated bank of ~120 five-letter legal terms (enough for ~4 months without repeats; daily index = `daysSinceEpoch % LIST.length`). Initial seed:

```
WRITS TORTS BENCH GAVEL JUDGE JURYS PLEAD VENUE BRIEF MOTUS
ACTUS GUILT LIBEL PROBE ENACT VOTED PROXY OATHS PROOF CLAIM
MERIT FRAUD FORUM ARSON BAILS SUITS APPEL GRAND PETIT MENSA
LEASE TITLE DEEDS BONDS FILES SERVE PAROL ORDER QUASH STARE
DUTYS BLAME COURT BAILS CANON DICTA EQUIT FELON HEIRS LIENS
NOTES PARTY POWER REPLY RIGHT SCORE SEALS STATE TRIAL VOTER
... (final list curated to remove duplicates, archaic spellings, and anything offensive)
```

We'll also include a larger **accept list** (~2000 common English 5-letter words) so users can type real words even if not in the answer pool. Otherwise the game is too restrictive.

## Files

- **NEW** `src/components/footer-arcade/objection/words.ts` — answer list + accept list (the accept list = compact JSON imported from a static file).
- **NEW** `src/components/footer-arcade/objection/Objection.tsx` — game component (grid + keyboard + state machine).
- **NEW** `src/components/footer-arcade/objection/storage.ts` — localStorage helpers (`getTodayState`, `saveGuess`, `getStreak`).
- **NEW** `src/components/footer-arcade/objection/share.ts` — ASCII share-text builder.
- **REPLACE** `src/components/FooterArcade.tsx` — becomes a thin wrapper that renders `<Objection />`. Keeps the existing lazy-import in `Footer.tsx` working without changes.
- **DELETE** old memory-game internals (in same file replacement).

## Technical notes

- Pure client-side. Zero backend, zero Supabase.
- Daily index: `Math.floor((Date.now() - EPOCH) / 86400000) % ANSWERS.length`. EPOCH = `Date.UTC(2026, 0, 1)`.
- localStorage key: `locus.objection.v1` → `{ date: 'YYYY-MM-DD', guesses: string[], status: 'playing'|'won'|'lost', streak: number, lastPlayed: string }`.
- Physical keyboard: `useEffect` window listener, cleaned up on unmount.
- Tile flip uses CSS `transform: rotateX` (not Y, so it reads as a stamp-flip — fits the neobrutal "EXHIBIT" vibe).
- Accessibility: each tile has `aria-label`, keyboard fully navigable, `aria-live="polite"` region announces win/loss/invalid.
- No emojis anywhere — share string uses ASCII blocks.
- Bundle: accept-list JSON ~30KB gzipped; acceptable since component is lazy-loaded.

## Memory updates

After build, update `mem://features/footer` to replace "neobrutalist memory game" with "Objection! daily legal Wordle (localStorage, no backend)".

## Out of scope (future)

- Global leaderboard / streak sync (would need auth + Supabase table).
- Hard mode (must reuse confirmed letters).
- Hint button.
- Custom word submissions.

If you want any of these in v1, say so before I build.
