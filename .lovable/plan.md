# Add Share button to Directory cards (Firms + Startups)

The FirmDrawer/StartupDrawer already have Share — but you have to open the drawer to use it. Add a Share2 icon directly on each grid card so it works at-a-glance, just like Vacancies.

## Firm cards (`src/pages/Directory.tsx`, ~L448–459)
Replace the lone Compare checkbox at top-right with a small action group: **Share + Compare**, both 24×24, gap-1.

- Share button: `Share2` icon, muted → accent on hover.
- `e.stopPropagation()` so it doesn't open the drawer.
- URL: `https://locus.legal/directory?firm={encodeURIComponent(name)}` + `withRef(..., "firm-card")`.
- Copy: `"{name}, {city} — found via Locus"`.
- Toast `"Link copied"` on copied result.

## Startup cards (`src/pages/Directory.tsx`, ~L615–649)
Add an absolute-positioned `Share2` button at top-right corner (startup cards currently have nothing there).

- URL: `https://locus.legal/directory?mode=startups&startup={encodeURIComponent(name)}` + `withRef(..., "startup-card")`.
- Copy: `"{name}{, city}{ · sector} — found via Locus"`.

## Imports
Add to existing lucide import: `Share2`. Add at top: `import { toast } from "sonner";` and `import { shareOrCopy, withRef } from "@/lib/share";`.

## What stays the same
- Card click still opens drawer.
- Compare checkbox unchanged in behaviour (just sits beside Share now on firm cards).
- Drawer Share buttons remain (mirrors site-wide pattern).
- No layout/visual disruption — Share icon is the same compact 24px treatment as Compare.
