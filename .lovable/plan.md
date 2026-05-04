## What's broken

In the screenshots (mobile, steps 4 & 5):

1. **Step 4 "Browse Opportunities"** targets `[data-tour="opportunities-nav"]`, which only exists on the **desktop navbar** (`hidden md:flex`). On mobile it still matches a hidden element, so the spotlight lands on a 0×0 box and you see a stray yellow stripe at the page edge instead of a real highlight.
2. **Step 5 "Search anything"** targets `[data-tour="search"]` on `SearchFab`, which is also `hidden md:flex` — same problem. The body copy ("Press Cmd+K") is also nonsensical on a phone.
3. The tooltip itself sits at `bottom: 12` on mobile and visually crowds the browser chrome / mobile dock area.

`TourProvider.start()` already filters out steps whose target is missing — but `document.querySelector` happily returns hidden elements, so the filter doesn't catch this case.

## Fix

### 1. Add real mobile anchors (`src/components/MobileBottomDock.tsx`)
- Tag the **Opportunities** dock item with `data-tour="opportunities-nav-mobile"`.
- Tag the **Search** dock button with `data-tour="search-mobile"`.

### 2. Make tour steps device-aware (`src/components/tour/appTourSteps.ts`)
- Convert step 4's `target` to a comma selector: `'[data-tour="opportunities-nav"], [data-tour="opportunities-nav-mobile"]'` and switch placement to `"auto"` so it picks `top` on mobile (dock is at the bottom).
- Same for step 5: `'[data-tour="search"], [data-tour="search-mobile"]'`, placement `"auto"`.
- Rewrite step 5 body to be device-agnostic, e.g. *"Tap search anywhere on Locus to jump to firms, guides, tools, opportunities — instantly. (Cmd+K on desktop.)"*

### 3. Filter truly-visible elements (`src/components/tour/TourProvider.tsx`)
Update the `start()` filter so a step is only kept when its target actually has layout (non-zero `getBoundingClientRect`). This prevents future regressions where a `hidden md:flex` element silently passes the filter.

```ts
const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};
const resolvable = s.filter((step) => {
  const el = document.querySelector(step.target);
  return el ? visible(el) : false;
});
```

### 4. Keep tooltip clear of the mobile dock (`src/components/tour/TourOverlay.tsx`)
On mobile, change the tooltip's `bottom: 12` to `bottom: 88` (dock is ~64px + breathing room) so the card never overlaps the dock or browser UI. Also raise its `z-index` above the dock if needed.

## Out of scope
- No analytics changes, no new components, no routing changes.
- Desktop tour behaviour stays identical.
