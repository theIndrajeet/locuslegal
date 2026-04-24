

# Locus+ v2 — pixel-faithful dark neobrutalist rebuild

The current Locus+ track is on a light cream surface. The HTML prototype you shared is **dark neobrutalist** with cream `paper` reserved only for document/legal content. This plan replaces the existing premium look with a pixel-faithful port of that prototype, keeping all backend / grading / props contracts intact.

## 1. Design tokens (replace the current `.locus-plus` scope in `src/index.css`)

New scope `.locus-plus` becomes the dark shell:

- `--lp-bg: #000`, `--lp-bg-1: #0a0a0a`, `--lp-bg-2: #121212`, `--lp-bg-3: #1a1a1a`
- `--lp-line: #262626`, `--lp-line-2: #3a3a3a`
- `--lp-text: #fff`, `--lp-text-2: #b4b4b4`, `--lp-text-3: #6e6e6e`
- `--lp-accent: #FFC940`, `--lp-accent-ink: #111`, `--lp-accent-soft: rgba(255,201,64,.12)`, `--lp-accent-soft-2: rgba(255,201,64,.22)`
- `--lp-good: #3ecf8e`, `--lp-good-soft: rgba(62,207,142,.14)`, `--lp-bad: #ff5a5f`, `--lp-bad-soft: rgba(255,90,95,.14)`
- `--lp-paper: #f5f1e8`, `--lp-paper-ink: #1a1712`
- Border `2px`, radius `6px` / `4px`. **No shadows. No gradients.**
- Fonts: import **Cormorant Garamond** + **JetBrains Mono** in `index.html` (Sora + Inter already loaded). Add `--lp-font-serif` and `--lp-font-mono`.
- Utility classes scoped under `.locus-plus`: `.lp-display`, `.lp-serif`, `.lp-mono`, `.lp-up` (uppercase 11px tracked .14em).

The old `--premium-*` tokens, `.premium-paper`, fade-in keyframes, etc. are removed. All four renderers and the shell get rewritten against the new tokens.

## 2. Shell — `PremiumShell.tsx` rewrite

Replaces today's centered light card with the prototype's app shell:

```text
┌──────────────┬──────────────────────────────────────────┐
│ locus.•      │  ←  badges row              points · pts │   top-bar (sticky)
│ THE BAR ·    │──────────────────────────────────────────│
│ RESEARCH     │  Instruction strip · counter chip        │   instr-strip
│              │──────────────────────────────────────────│
│ 01 Document  │                                          │
│ 02 Brief     │            <renderer slot>               │   canvas-wrap
│ 03 Ethics    │                                          │
│ 04 Counsel   │──────────────────────────────────────────│
│              │  N flags         [ Submit Review ]       │   sticky-submit
│ Student      │                                          │
│ 7d streak    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- 220px sidebar with `locus.` wordmark + accent dot, "THE BAR · RESEARCH PREVIEW" mono subtitle, 4 nav items numbered `01–04` (current type highlighted with amber number), session footer (student name from auth, streak, rank).
- Sticky top bar: back arrow (2px bordered square button), badge row (format / area / difficulty colored easy/med/hard / Locus+ accent badge), points on the right (mono, amber number).
- Instruction strip: prompt left, amber counter chip on the right (`N FLAGGED`, `STEP X/Y`, `TURN X/Y` — driven by a new `counter` prop).
- Sticky submit bar at bottom: left mono meta, primary amber button. Disabled / grading / result states.
- Sidebar collapses to a top horizontal nav strip below `lg`.

Props change (additive): `counter?: string`, `submitDisabled?: boolean`, `submitting?: boolean`, `onSubmit?: () => void`, `navItems` derived from `PREMIUM_TYPES`.

## 3. Renderer rewrites (pixel-faithful to prototype)

Backend payload contracts and submitted-answer shapes stay identical, so `submit-bar-attempt` and `AttemptReviewDialog` keep working.

**`PremiumDocumentReview`**
- Cream `.lp-paper` card, max-width 860px, 64/80px padding, 2px border, `--lp-paper-ink` text.
- Mono meta header (doc id · CONFIDENTIAL · date), serif `h1` doc title, italic serif sub.
- Body in Cormorant Garamond 18px / 1.65; flaggable spans rendered with dotted underline; click toggles amber-highlight `.f.flagged`.
- States — `empty / base / grading (overlay spinner "Grading your review…") / result (correct-found = green fill, missed = red underline, false-flag = dashed amber)`.
- Right rail dropped — categories now live inside a small popover anchored to each flag, matching the prototype's tap-to-flag flow. (Existing answer-state shape unchanged.)
- Result banner inside the paper: score + breakdown row (`Found 3/5 · 1 false flag · 14/20 pts`).

**`PremiumBriefBuilder`**
- 2-col layout: 360px sticky cream fact card (serif body, "Priya v. QuickMart (2024)" tag), main wizard on dark.
- 4-step stepper across the top (Statute / Precedent / Arguments / Rebuttal). Done = amber check, active = white border, todo = muted.
- Option cards: `bg-bg-1`, 2px line border, mono A/B/C/D letter badge, title + subtitle. Selected = amber border + `--lp-accent-soft` bg.
- Step 3 (Arguments): drag-to-reorder list using existing dnd-kit, drag handle icon, mono position number, drop target highlights with amber border.
- Step 4 result: per-step Correct/Wrong badge cards + amber-bordered explainer card.

**`PremiumEthics`**
- Single column, max-w 820px centered.
- Stage rail at top (3 numbered boxes: Your decision → The consequence → Reveal).
- Scenario card: `bg-bg-1`, 2px border, mono "THE SITUATION" label, Cormorant Garamond ~20px body, faint amber Scales watermark icon top-right (Lucide `Scale`, opacity .25).
- Sora 700 24px question, full-width option button cards with mono letter badge.
- Stage 2 echo banner: `bg-accent-soft`, "STAGE 1 · YOU CHOSE" + chosen text.
- Result reveals both choices color-coded + explanation card (amber border).

**`PremiumClientCounseling`**
- 2-col split, full viewport height.
- Left chat panel: header with avatar (initial letter A in amber square) + matter name + subtitle. Scrollable messages — client left in `bg-bg-2` bubble, lawyer right in `bg-accent-soft` amber bubble. Typing indicator = 3 pulsing amber dots + mono "AWAITING INPUT" while awaiting student response.
- Right decision panel: question heading, mono "TURN N OF 5" label, scrollable option list (Cormorant Garamond text, mono letter prefix), footer with hint text + "Send Response" amber button.
- Result view in decision panel: score, per-turn list with green ✓ / red ✗ + 1-line note.
- Auto-scroll chat to bottom on every state change.

## 4. Wiring updates

- **`TheBarChallenge.tsx`** — already routes premium types through `PremiumShell`; just plumb new `counter`, `submitDisabled`, `onSubmit` props, drop the centered light layout.
- **`TheBarPreview.tsx`** — premium tabs already swap to premium renderers; wrap each in the new dark shell with sample sidebar/badges. Keep the existing 8-tab preview structure.
- **`AttemptReviewDialog.tsx`** — keep `.locus-plus` wrapper; the new dark scope means premium reviews now render on the dark canvas, matching the play experience.
- **`PremiumBadge.tsx`** — restyle to the prototype's amber `.badge.accent` (mono 10.5px, 2px amber border, accent-soft bg, "LOCUS+" text).
- **`ChallengeCard.tsx`** — badge already wired via `isPremiumType`; only its visual restyles.
- **`PremiumPrimitives.tsx`** — replace `PremiumCard` / `PremiumLabel` / `PremiumButton` / `PremiumChip` with neobrutalist equivalents (2px border, no shadow, mono labels). Drop the cream-paper variants.

## 5. Out of scope (unchanged)

- Edge functions (`submit-bar-attempt`, `draft-question-from-prompt`, `rit-chat`, etc.).
- `ChallengeForm.tsx` admin authoring.
- The neobrutalist non-premium pages and the other 4 renderers (MCQ, Issue Spotter, Speed Round, Jurisdiction).
- Database schema and answer-state shapes.

## 6. Acceptance

- `/the-bar/preview` Document Review tab matches the prototype: dark shell, sidebar with `01–04`, instruction strip, cream NDA paper, dotted underlines, amber flag toggling, sticky submit bar, grading overlay → result banner with green/red/dashed-amber spans.
- Brief Builder: sticky cream fact card + dark wizard, 4-step stepper, drag reorder on Step 3, per-step result cards.
- Ethics: 3-stage rail, dark scenario card with watermark, amber echo banner on Stage 2, color-coded reveal.
- Client Counseling: dark 2-col split, alternating bubbles, typing indicator, decision panel with mono turn label, result view.
- Live `/the-bar/challenge/:id` and review dialog use the same shell+renderers when `isPremiumType()`.
- Other 4 formats and the rest of the site remain untouched.
- No emoji, no gradients on dark surfaces, no rounded-xl, no drop shadows on dark cards. Cormorant Garamond confined to paper/scenario/chat content.

