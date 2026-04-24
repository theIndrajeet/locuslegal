## Plan

I found the real reason this keeps feeling “stuck”:

- The screen in your screenshots is **not using `ChallengeShell`**.
- It is using **`PremiumShell`** via `src/pages/TheBarChallenge.tsx` for premium challenge types like **Brief Builder**.
- `PremiumShell` already has its **own full-page UI chrome**:
  - left rail
  - sticky top bar with back + chips + points
  - sticky bottom action bar
- But `src/components/Layout.tsx` still wraps **every route** with the global **Navbar + Footer + MobileBottomDock**.

So there are currently **two different layouts fighting each other** on `/the-bar/challenge/:id`:

```text
Global Layout
  fixed Navbar
  Footer
  Mobile dock

Challenge Page
  PremiumShell
    sticky sidebar
    sticky top challenge bar
    sticky bottom CTA
```

That is why padding tweaks kept failing: the problem is **layout ownership**, not spacing.

### What I’ll change

1. **Make `/the-bar/challenge/:id` a standalone page shell**
   - Remove the global Navbar/Footer/Mobile dock from that route.
   - Let `PremiumShell` be the only header/sidebar system on challenge pages.

2. **Keep the challenge-specific chrome intact**
   - Preserve the PremiumShell top strip:
     - back button
     - brief builder / family / difficulty / Locus+ chips
     - points in the top-right corner
   - Preserve the left rail and sticky footer CTA.

3. **Clean up challenge route behavior for both premium and non-premium types**
   - Premium types will render correctly with no overlap.
   - Non-premium challenge screens in `TheBarChallenge.tsx` will still work as standalone pages; if needed, I’ll slightly adjust their top spacing after removing the global navbar.

4. **Verify the exact breakpoint that is breaking now**
   - Check the current 1000px viewport behavior.
   - Confirm the top challenge bar is fully visible.
   - Confirm the left “The Bar · Research Preview” text is no longer clipped.
   - Confirm points no longer collide with the profile/theme area because that global area will no longer exist on this route.

### Files I expect to update

- `src/components/Layout.tsx`
- possibly `src/App.tsx` if route-level separation is cleaner there
- possibly `src/pages/TheBarChallenge.tsx` for final standalone spacing polish

### Technical details

Current root cause in code:
- `Layout.tsx` always renders:
  - `<Navbar />`
  - `<Outlet />`
  - `<Footer />`
  - `<MobileBottomDock />`
- `TheBarChallenge.tsx` renders `<PremiumShell />` for premium question types.
- `PremiumShell.tsx` uses:
  - `aside className="... sticky top-0 h-screen ..."`
  - `header className="sticky top-0 z-10 ..."`

So the challenge page is behaving like a self-contained app **inside another app shell**.

No database or backend changes are needed.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>
<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>