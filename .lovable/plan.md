# Fix Opportunities filter bar (mobile-first)

The sticky filter strip on `/opportunities` looks cramped on mobile (390px) — group tabs wrap awkwardly, count badges collide with labels, and the sub-filter row competes visually with the primary tabs. Redesign for clarity at small widths while keeping the neobrutalist feel.

## Changes (single file: `src/pages/Opportunities.tsx`, lines 119–178)

### 1. Group tabs → full-width segmented control on mobile
- Replace `flex flex-wrap justify-center gap-2` with a 3-column grid (`grid grid-cols-3 gap-2`) so the three groups (Career / Academic / Contests) always fit in one row at any viewport.
- Stack count above label on mobile (`flex-col`) and inline on `sm+` (`sm:flex-row`).
- Reduce padding (`px-2 py-2.5`) and use `text-xs sm:text-sm` so labels never truncate.
- Keep brutalist border + shadow, but drop the count pill background when active (just dim opacity) — current `bg-background/20` looks muddy on yellow.

### 2. Sub-filter pills → horizontal scroll strip
- Wrap the pill row in `flex overflow-x-auto no-scrollbar -mx-4 px-4` so it scrolls on mobile instead of wrapping to two lines.
- Add `whitespace-nowrap shrink-0` to each pill.
- Drop the dividing `border-b-2` between groups and pills — replace with subtle `gap-2.5` spacing so the bar reads as one unit.

### 3. Sticky polish
- Add `backdrop-blur-md bg-background/85` to the sticky container so cards scrolling underneath aren't visible through gaps.
- Tighten vertical padding (`pt-2 pb-2.5` → `py-2`).
- Hide sub-filter row entirely when only one stream in group (already done) — keep.

### 4. Header tweak
- On mobile, center the header subtitle and reduce `mb-8` → `mb-5` so the filter bar sits closer to the title.

## Out of scope
- Card grid layout (looks fine).
- Detail dialog.
- Empty/loading states.

## QA
- Test at 390px (mobile), 768px (tablet), 1280px (desktop).
- Confirm 3 groups always fit one row on 320px+.
- Confirm sub-filter pills scroll horizontally on mobile when 3+ streams.
