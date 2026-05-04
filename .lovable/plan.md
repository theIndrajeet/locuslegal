## Add skeleton loader to Opportunities page

Currently `/opportunities` shows a single centered `Loader2` spinner during the initial fetch. This feels jarring vs. the rest of the site (Directory, Bar, Playbook all use card-shaped skeletons). I'll replace it with skeleton cards that match the actual grid layout.

### Changes

**File: `src/pages/Opportunities.tsx`**

1. Replace the spinner block (lines 287-290) with a 2-column responsive grid (`grid-cols-1 md:grid-cols-2 gap-4 md:gap-5`) of 6 skeleton cards — same layout the real results render into. This avoids layout shift when data arrives.

2. Add a small inline `OpportunitySkeletonCard` component below `OpportunityCard` that mirrors the real card shape:
   - Same neobrutalist shell: `bg-card border-2 border-foreground/80 rounded-2xl p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))]`
   - Left accent bar (1.5w stripe, muted)
   - Top row: small pill skeleton (stream chip) + countdown pill skeleton on the right
   - Title skeleton (1 wide bar + 1 short bar)
   - Organiser skeleton (medium bar)
   - 2-3 small chip skeletons for the meta row
   - Footer divider with a "source" skeleton + "view details" skeleton
   - Uses the existing `Skeleton` component from `@/components/ui/skeleton` (which already has `animate-pulse bg-muted`)

3. Import `Skeleton` from `@/components/ui/skeleton`. Remove the `Loader2` import only if no longer used elsewhere on the page (it is — keep it).

### Why this approach

- Matches the visual language users already see on Directory and Bar pages.
- Pre-renders the grid at the right height → no jump when items hydrate.
- Zero behavioural change; purely a loading-state polish.

No backend, schema, or memory changes needed.