## The problem

In the screenshot, the share icon on each Directory card looks squeezed against an empty rounded box (the Compare checkbox, which is invisible until hover) and visually collides with the rating "5" pill below. The same pattern — a too-small `Share2` icon stuffed into a tight absolute corner — repeats across the app with **inconsistent sizes and chrome**:

| Location | Button size | Icon size | Issue |
|---|---|---|---|
| Directory firm card | 24×24 | 12 | Tiny icon, sits next to invisible compare box, collides with rating pill |
| Directory startup card | 24×24 | 12 | Same |
| Bar ChallengeCard | 28×28 | 13 | Inconsistent |
| VacancyCard | 28×28 | 14 | Inconsistent |
| PlaybookGuide | ~28×28 | 14 | Inconsistent |
| Opportunities row | varies | 14 | Inconsistent |

No shared component → every card reinvents the wheel.

## The fix

### 1. Create one shared component: `src/components/ShareIconButton.tsx`

A single canonical share button used everywhere. Props: `onShare`, optional `label`, optional `size` (`sm` | `md`, default `md`).

- `md` (default): `h-8 w-8`, `Share2 size={15} strokeWidth={2.2}`
- `sm` (dense lists): `h-7 w-7`, `Share2 size={14} strokeWidth={2.2}`
- Chrome: `rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 active:scale-95 transition-colors`
- Always: `type="button"`, `aria-label`, `title="Share"`, internally `e.stopPropagation()`

This becomes the "everywhere" share affordance — bigger, clearly tappable (≥28px touch target), consistent.

### 2. Fix the Directory card collision (the visible bug)

In `src/pages/Directory.tsx` for both firm cards (line ~450) and startup cards (line ~640):

- Replace inline share `<button>` with `<ShareIconButton size="sm" />`.
- Make the **Compare checkbox always visible** with a faint border (`border-border/40`) so it stops looking like a phantom box — currently `border-border/50` only appears on hover via the group state, which is what makes the share icon look orphaned.
- Bump the title row's `pr-8` → `pr-16` so the rating "5" pill no longer slides under the action stack.
- Tighten the action stack: `gap-1` → `gap-1.5`, move from `top-3 right-3` → `top-3 right-3` (unchanged) but ensure both children are `h-7 w-7` so they align.

### 3. Replace ad-hoc share buttons with `ShareIconButton`

Swap the inline implementation in:
- `src/components/bar/ChallengeCard.tsx` (line 58–68) → `<ShareIconButton size="sm" />`
- `src/components/vacancies/VacancyCard.tsx` (line 218–234) → `<ShareIconButton size="sm" />`
- `src/pages/PlaybookGuide.tsx` (line ~135–142) → `<ShareIconButton />` (md, header context)
- `src/pages/Opportunities.tsx` icon-only spots (line ~395–400) → `<ShareIconButton size="sm" />`. Leave the labelled "Share / Copied" `<Button>` at line 669 alone — it's a full text button, different affordance.
- `src/components/FirmDrawer.tsx`, `src/components/StartupDrawer.tsx`, `src/pages/PublicProfile.tsx`, `src/components/bar/ResultScreen.tsx`, `src/pages/Tools.tsx`, `src/pages/Resources.tsx` — audit each; swap icon-only share buttons; leave labelled buttons alone.

### Out of scope

- Changing the `shareOrCopy` logic in `src/lib/share.ts` — works fine.
- Redesigning the Compare interaction itself.
- Touching the labelled `<Button>… Share` variants that include text.

### Files touched

- **New:** `src/components/ShareIconButton.tsx`
- **Edited:** `src/pages/Directory.tsx`, `src/components/bar/ChallengeCard.tsx`, `src/components/vacancies/VacancyCard.tsx`, `src/pages/PlaybookGuide.tsx`, `src/pages/Opportunities.tsx`, `src/components/FirmDrawer.tsx`, `src/components/StartupDrawer.tsx`, `src/pages/PublicProfile.tsx`, `src/components/bar/ResultScreen.tsx`, `src/pages/Tools.tsx`, `src/pages/Resources.tsx` (only where icon-only Share2 lives).
