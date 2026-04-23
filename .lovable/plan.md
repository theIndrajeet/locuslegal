

# Locus+ Premium Track — pixel-faithful redesign for the 4 new formats

Goal: rebuild Document Review, Brief Builder, Ethics, and Client Counseling so they look and feel premium and distinct from the rest of The Bar. The other 4 formats (MCQ, Issue Spotter, Speed Round, Jurisdiction) stay neobrutalist. Backend grading, admin authoring, and Rit logic remain untouched.

## Visual system (Locus+)

- Palette: off-white paper `#faf8f3`, ink `#1a1a1a`, muted ink `#5a5a5a`, hairline border `#e6e1d6`, Locus yellow accent (existing token) for highlight/correct/focus only.
- Typography: serif headings (Instrument Serif or Fraunces via Google Fonts), Inter for body and UI. No Sora inside Locus+ surfaces.
- Surfaces: paper cards with 1px hairline border, soft layered shadow (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.12)`), 12–14px radius. No hard 4px black box-shadow.
- Motion: gentle fades and 200ms ease transitions. No glitch / shimmer effects inside Locus+.
- Badge: small pill "Locus+" — ink text, hairline border, tiny yellow dot. Used on challenge cards, preview tiles, and the shell header.

All of the above lives in a scoped `.locus-plus` wrapper so it never leaks into neobrutalist pages.

## Components to add

- `src/components/bar/premium/PremiumShell.tsx` — replaces `ChallengeShell` for the 4 types. Paper canvas, serif title, breadcrumb-style meta row (type · difficulty · points), Locus+ badge, footer with autosave indicator and primary action.
- `src/components/bar/premium/PremiumBadge.tsx` — the Locus+ pill, reusable on cards/headers.
- `src/components/bar/premium/PremiumCard.tsx`, `PremiumButton.tsx`, `PremiumChip.tsx` — small primitives so renderers stay clean.
- `src/lib/bar/premium.ts` — `PREMIUM_TYPES = ['document_review','brief_builder','ethics','client_counseling']` + `isPremiumType()` helper.

## Renderers — pixel-faithful rewrites

Each rewritten against the approved mocks, keeping current props/contract so grading and review code don't change.

1. **DocumentReviewRenderer** — paper document column with serif body text, click-to-flag spans, right rail with category chips and a running flag list. Review state shows hit / miss / false-flag overlay with subtle color coding (green tick, red cross, yellow caret) on the same paper surface.
2. **BriefBuilderRenderer** — 4-step progress rail (Statute → Precedent → Arguments → Rebuttal) at top, single focused step per screen, Arguments step uses drag handles + up/down arrows, autosave dot in footer ("Saved · just now").
3. **EthicsRenderer** — Stage 1 decision presented as a serif scenario card with two large choice buttons; on submit, animated reveal of consequence text, then Stage 2 follow-up MCQ in the same paper frame. Rubric feedback rendered as an inline note, not a toast.
4. **ClientCounselingRenderer** — chat transcript styled like a printed deposition: client turns left-aligned in muted ink, lawyer turns right-aligned on yellow-tinted paper, decision turns interrupt the scroll with an inline MCQ card. Model follow-up shown after submission.

## Wiring

- `TheBarChallenge.tsx`: route premium types through `PremiumShell` + premium renderer; everything else continues to use `ChallengeShell`.
- `TheBarPreview.tsx`: the 4 demo tiles for premium formats get the Locus+ badge and open into the premium shell.
- `ChallengeCard.tsx` (browse + history): show Locus+ badge when `isPremiumType(type)`.
- `AttemptReviewDialog.tsx`: when reviewing a premium-type attempt, render inside a `.locus-plus` wrapper so the review matches the play experience.

## Tokens & fonts

- `src/index.css`: add a `.locus-plus { … }` scope defining `--premium-bg`, `--premium-ink`, `--premium-muted`, `--premium-border`, `--premium-accent` (maps to existing yellow), `--premium-shadow`, and `font-family` overrides for headings/body. Import the chosen serif via Google Fonts in `index.html`.
- `tailwind.config.ts`: add `fontFamily.serif` and `boxShadow.premium`, plus `colors.premium.*` mapped to the CSS vars so renderers can use `bg-premium-bg`, `text-premium-ink`, etc.

## Out of scope (unchanged)

- `submit-bar-attempt`, `draft-question-from-prompt`, `rit-chat`, `extract-questions-from-pdf`, `suggest-topics`.
- `ChallengeForm.tsx` admin authoring (already supports the 4 types).
- All neobrutalist pages and the other 4 renderers.

## Acceptance

- `/the-bar/preview` shows the 4 premium formats inside the Locus+ shell, visually matching the mocks (paper, serif, hairline borders, Locus+ badge); the other 4 remain neobrutalist.
- Live `/the-bar/challenge/:id` uses the same shell when `isPremiumType(challenge.type)`.
- Locus+ badge appears on premium challenge cards in browse/history and on the shell header.
- Attempt review for premium types renders in the premium shell.
- No regression to MCQ / Issue Spotter / Speed Round / Jurisdiction; no changes to grading, AI, or admin behavior.

