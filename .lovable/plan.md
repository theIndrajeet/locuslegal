# Plan: Polish CFP/Moot/Competition detail dialog

User feedback on screenshot: (1) submission link + brochure/guidelines link should be clearly visible at the top, both styled in yellow; (2) `SOURCE:` line is partially hidden behind the sticky CTA bar / bottom fade.

## Edit `src/pages/Opportunities.tsx` — `DetailDialog` body

1. **Add an "Important links" section at the very top of the scrollable body**, above "Key details":
   - Yellow accent panel: `border-2 border-accent bg-accent/15` with hard `shadow-[3px_3px_0_0_hsl(var(--accent))]`.
   - Two side-by-side buttons (1-col on mobile, 2-col on `sm`):
     - **Primary submission/registration/apply link** → solid `bg-accent text-accent-foreground` with foreground hard-shadow.
     - **Brochure / Submission guidelines** → `bg-background` with accent border & accent hard-shadow. Label is "Submission guidelines" for CFPs, "Brochure" otherwise.
   - Each tile shows a Lucide icon (`ExternalLink` / `FileText`) + label + small "Open" hint, truncated for long URLs.
   - Whole block hidden if neither URL exists.

2. **Fix the source line being clipped**:
   - Increase scroll body bottom padding from default to `pb-12` so the "SOURCE:" line is fully visible above the sticky CTA bar.
   - Reduce the bottom scroll-fade height from `h-6` to `h-3` so it doesn't mask the source text.

3. Keep existing sticky CTA footer unchanged (Copy link + Brochure + primary CTA) — the new top block is the prominent visual entry, the footer remains as the persistent action bar.

## Out of scope
- No DB changes, no card/listing changes, no admin UI changes.
