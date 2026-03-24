

## Dynamic Directory Overhaul

### What we're building
A fully dynamic directory with live search, firm detail drawers, sort & compare, polished filters, and a city-based map view toggle.

### Changes

**1. Polish filter bar** (`src/pages/Directory.tsx`)
- Add animated filter chips below the bar showing active filters as dismissible tags (e.g. "City: Delhi ✕")
- Add a "Clear All" button when any filter is active
- Show real-time result count badge on each type pill (e.g. "Law Firms (2,341)")
- Smooth fade transition on result count text

**2. Live search with debounced instant feedback**
- Add 200ms debounce to search input
- Show a subtle loading shimmer on cards while filtering (instant feel)
- Animate cards in/out with staggered fade-in when results change

**3. Sort controls** (`src/pages/Directory.tsx`)
- Add a sort dropdown next to the result count: Rating (high→low), Name (A→Z / Z→A), Tier
- Sort applied via `useMemo` on the filtered array

**4. Firm detail drawer** (new `src/components/FirmDrawer.tsx`)
- Clicking a firm card opens a slide-in drawer (right side) using the existing Sheet component from `src/components/ui/sheet.tsx`
- Shows full details: name, address, type, tier, rating, phone (click-to-call), email (click-to-mail), Google Maps link ("Open in Maps" button using the address)
- Animate in with `slide-in-right`

**5. Compare feature** (`src/pages/Directory.tsx` + new `src/components/CompareBar.tsx`)
- Each card gets a small "Compare" checkbox
- Selecting 2-3 firms shows a sticky bottom bar with a "Compare Selected" button
- Clicking opens a modal/drawer with a side-by-side table: name, tier, rating, city, area, contact info

**6. Map view toggle** (new `src/components/DirectoryMap.tsx`)
- Toggle button (Grid / Map) in the results header
- Map view: a stylized SVG or simple visual showing cities as clusters with firm counts
- Clicking a city cluster auto-sets the city filter
- No external map API needed — use a simple India outline SVG with city pins positioned by hardcoded coordinates for Delhi, Mumbai, Bangalore, etc.

### Files
| Action | File |
|--------|------|
| Major edit | `src/pages/Directory.tsx` — filters, sort, live search, compare checkboxes, map toggle |
| Create | `src/components/FirmDrawer.tsx` — detail slide-in panel |
| Create | `src/components/CompareBar.tsx` — sticky compare bar + comparison modal |
| Create | `src/components/DirectoryMap.tsx` — simple map view with city clusters |

### Technical notes
- Uses existing `Sheet` component for the drawer
- Uses existing `Dialog` for compare modal
- Debounce via a simple `useEffect` + `setTimeout` pattern (no new deps)
- Card animations use existing `animate-fade-in` with staggered `animation-delay`
- Map uses inline SVG — no external libraries or API keys needed

