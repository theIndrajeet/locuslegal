# Arcade Lab — playable demo of all three footer game ideas

Build a private `/arcade-lab` page (mirrors the existing `/dock-lab` pattern: noindex, not linked from nav) where all three game concepts run side-by-side as fully working prototypes. Nothing in the live footer changes. You play, you pick, then I rip out the memory game and ship the winner.

## What you'll see at /arcade-lab

Three neobrutal cards in a row (stacked on mobile), each with the live game inside:

```text
┌─ Lex's Lockbox ───┐  ┌─ Objection! ──────┐  ┌─ Stamp Sort ──────┐
│  ▲ ▲ ▲            │  │ ┌─┬─┬─┬─┬─┐       │  │  EXHIBIT          │
│  3 7 1            │  │ ├─┼─┼─┼─┼─┤  x6   │  │  "NDA between..." │
│  ▼ ▼ ▼            │  │ └─┴─┴─┴─┴─┘       │  │                   │
│  ● ● ○  Try unlock│  │ [QWERTY keyboard] │  │  [A] [B] [C]      │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

Each card has: title, one-line tagline, the playable game, and a short notes line ("habit hook", "tactile", "playful").

## Game prototypes

### 1. Lex's Lockbox
- Three digit dials (0–9), ▲/▼ buttons to roll each.
- "Try unlock" button → checks against a random 3-digit code (per session).
- Hint dots: shows *how many* digits are correct, not which.
- Win state: digits flip to yellow, "Sustained" label, unlock icon.
- Reset button rolls a new code.

### 2. Objection!
- 6×5 Wordle grid + on-screen QWERTY + physical keyboard support.
- Demo uses a random word from a ~45-term seed list per session (real version = daily UTC rotation with localStorage persistence).
- Tile states: yellow (hit), white outline (near), muted (miss). Keyboard keys recolor cumulatively.
- Invalid word → shake + toast "Not in word list".
- Win → "Sustained." Loss → "Overruled — {WORD}".
- Reset = new word.

### 3. Stamp Sort
- A queue of 9 "EXHIBIT" cards, each with a snippet of text (a contract clause, an email line, a memo header).
- Three piles labeled **A Contract**, **B Email**, **C Memo**.
- Drag the top stamp onto a pile (also tap-to-file for mobile).
- Correct → stamp slot turns yellow, advances. Wrong → shake + misfile counter.
- Done state: "Filed. {n} correct · {m} misfiled" + reset.

All three styled with the existing tokens — bold borders, hard accent shadows, Sora/Inter, no emojis (Lucide icons only).

## Files

- **NEW** `src/components/arcade-lab/Lockbox.tsx`
- **NEW** `src/components/arcade-lab/Objection.tsx`
- **NEW** `src/components/arcade-lab/StampSort.tsx`
- **NEW** `src/pages/ArcadeLab.tsx` — three-column layout, noindex meta, lazy-loaded
- **EDIT** `src/App.tsx` — add `<Route path="/arcade-lab" element={<ArcadeLab />} />` (lazy import, mirrors `/dock-lab`)

No changes to `Footer.tsx`, no changes to the existing `FooterArcade.tsx`, no DB, no backend.

## After you pick

You reply with one of: **Lockbox** / **Objection!** / **Stamp Sort**. Then I:
1. Build the chosen game out properly (Objection! gets the daily rotation + localStorage + share string from the previous plan; the others get equivalent polish).
2. Replace the contents of `FooterArcade.tsx` so the live footer swaps in seamlessly.
3. Delete the `/arcade-lab` route + the two unused prototypes.
4. Update `mem://features/footer` to reflect the new game.

Approve and I'll ship the lab.
