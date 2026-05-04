# Add Share buttons across Locus

## Where Share already exists (audit)
- `VacancyCard` — Share2 button in card footer, uses `shareOrCopy` + `withRef` ✓
- `FirmDrawer` — Share2 in firm detail drawer ✓
- `bar/ResultScreen` — "Share result" after attempt ✓
- `PublicProfile` — "Share profile" button ✓

Pattern is identical everywhere: `Share2` lucide icon + `shareOrCopy({title, text, url: withRef(url, 'share')})` + toast on result.

## Where Share is missing (gaps to fill)

### 1. Opportunities (`src/pages/Opportunities.tsx`)
- **`OpportunityCard`** (~L328) — add a small Share2 icon button in the card footer, alongside the existing CTA. Mirrors `VacancyCard` exactly.
- **`DetailDialog`** (~L435) — add a "Share" button in the dialog header next to the close/CTA. URL: `https://locus.legal/opportunities?id={stream}-{id}` (use existing deep-link param if present, else just `/opportunities`).
- Copy: `"{title} — {org} · via Locus"` for jobs/internships/CFPs/moots/competitions, ref=`opportunity-share`.

### 2. Playbook (`src/components/playbook/GuideCard.tsx` + `src/pages/PlaybookGuide.tsx`)
- **`GuideCard`** — small Share2 button in card corner. URL: `/playbook/{slug}`, ref=`playbook-card`.
- **`PlaybookGuide`** reader — Share button in the guide header (next to MarkComplete). Copy: `"{guide title} — a Locus Playbook guide"`.

### 3. Startups (`src/components/StartupDrawer.tsx`)
- Mirror `FirmDrawer` exactly — Share2 button in drawer header. URL: `/directory?startup={slug}` (or current deep-link convention), ref=`startup-share`.

### 4. The Bar — Challenge (`src/components/bar/ChallengeCard.tsx`)
- Add Share2 to the challenge card so users can share a specific challenge before attempting. URL: `/bar/c/{slug}` (or current route), ref=`bar-challenge`.
- Copy: `"Try this Bar challenge on Locus: {title}"`.
- (ResultScreen already has share — leave it.)

### 5. Tools (`src/pages/Tools.tsx`)
- Add a Share2 icon on each tool card. URL: `/tools#{tool-id}`, ref=`tool-share`.
- Copy: `"{tool name} — free legal tool on Locus"`.

### 6. Resources (`src/pages/Resources.tsx`)
- Add Share2 next to each resource's Download button. URL: `/resources#{resource-id}`, ref=`resource-share`.
- Copy: `"{resource title} — free legal resource on Locus"`.

## Out of scope (intentionally skipped)
- Admin pages, Auth, ProfileEdit, AppHome, ApplicationTracker — internal/private, sharing makes no sense.
- Directory firm cards — already covered by `FirmDrawer`.
- Index/Hero — site-wide, browser share covers this.
- Bar Leaderboard / History — personal data, privacy concern.

## Implementation details
- **Helper used everywhere:** `shareOrCopy` + `withRef` from `@/lib/share` (already exported).
- **Icon:** `Share2` from `lucide-react`, `size={14}` for compact card buttons, `size={16}` for drawer/header buttons — matches existing usage.
- **Button style:** `Button variant="neutral" size="sm"` (or `icon`) to match VacancyCard's neobrutalist treatment.
- **Toast feedback:** on result `"shared"` → no toast (native sheet shown); `"copied"` → `toast.success("Link copied")`; `"failed"` → `toast.error("Couldn't share")`. Same as VacancyCard.
- **URL building:** use `window.location.origin + path` then wrap in `withRef(url, '<source>')`. Always pass a `ref` value so we can attribute share traffic in analytics later.
- **No new dependencies, no DB changes, no edge functions.** Pure UI addition.

## Acceptance
- Every card/drawer listed above has a visible Share2 button.
- Clicking it opens the native share sheet on mobile, copies link on desktop, and toasts accordingly.
- Each share URL contains a unique `ref=` value so we can later report which surface drove the most shares.
