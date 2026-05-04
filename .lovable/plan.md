## Goal

Roll the `/tour-lab` walkthrough into the real product. New users see it once on first visit to `/app`. Anyone can replay it anytime from the profile menu.

## Persistence approach

Local persistence (`localStorage`) keyed per user, **not** the database. The DB migration tool isn't available in this session, and localStorage is sufficient because:
- The tour is one-time UX polish, not a security/business-critical flag
- Survives across sessions on the same browser (the realistic "first signup" flow)
- Replay is always available from the profile menu, so a wiped browser just shows it once more — no harm

Key: `locus_tour_completed_v1:<userId>`.

## Files

**New**
- `src/components/tour/appTourSteps.ts` — The 5 real `/app` tour steps targeting `[data-tour="profile-strength"]`, `[data-tour="pipeline"]`, `[data-tour="practice"]`, `[data-tour="opportunities-nav"]`, `[data-tour="search"]`.
- `src/components/tour/AppTour.tsx` — Mounts `TourProvider` + `WelcomeModal` at the app shell. Reads `userId` from `useAuthSession`. On mount of `/app`, if `localStorage[locus_tour_completed_v1:<userId>]` is missing AND user is authed, opens the welcome modal → tour. Persists completion on Finish *and* Skip. Exposes a global `window.__locusReplayTour()` so `ProfileMenu` can trigger it.
- `src/hooks/useReplayTour.ts` — Tiny hook wrapping the same trigger for cleaner imports.

**Edited**
- `src/components/Layout.tsx` — Wrap `<Outlet />` (and `MobileBottomDock`/`Footer`) in `<AppTour>` so the tour can fire on `/app` and the replay trigger is globally available.
- `src/pages/AppHome.tsx` — Add `data-tour="profile-strength"` on the `ProfileStrengthMeter` wrapper, `data-tour="pipeline"` on the PipelinePane wrapper div, `data-tour="practice"` on the PracticePane wrapper div.
- `src/components/Navbar.tsx` — Add `data-tour="opportunities-nav"` on the desktop "Opportunities" `<Link>`.
- `src/components/search/SearchFab.tsx` — Add `data-tour="search"` on the FAB button.
- `src/components/ProfileMenu.tsx` — Add a "Replay product tour" item (Lucide `Sparkles` icon) above the divider before "Sign Out". Calls `window.__locusReplayTour()`.
- `src/components/tour/TourProvider.tsx` — Make it skip steps whose `target` selector doesn't resolve to a DOM element (so missing-mobile-anchor like `SearchFab` on small screens is gracefully bypassed instead of showing a tooltip floating in the corner). If all remaining steps are missing, `start()` no-ops.

## Trigger logic (AppTour)

1. On mount of any route, do nothing.
2. Subscribe to route + auth. When `pathname === "/app"` AND `userId` is set AND `localStorage[locus_tour_completed_v1:<userId>]` is empty:
   - Wait ~600ms (let `/app` finish its data fetch and reveal real anchors)
   - Open `WelcomeModal`. On "Start tour" → close modal → start tour.
3. `onFinish` and `onSkip` both write `localStorage[locus_tour_completed_v1:<userId>] = "1"`.
4. Replay (`window.__locusReplayTour`) wipes the key for the current user and starts the tour immediately (skips welcome modal — replay users know what they're getting).

## Edge cases covered

- **Pace-setter / @locus.internal accounts**: same as everyone, no special-case (they're internal QA, fine to see the tour).
- **`OnboardingChecklist` shown instead of panes** (score < 30): `[data-tour="practice"]`, `[data-tour="pipeline"]` won't exist. Engine skips them gracefully thanks to the missing-target skip. User still sees profile strength + opportunities + search — 3-step tour, still useful.
- **Mobile (≤640px)**: `SearchFab` is `hidden md:flex` → step skipped, mobile users see 4 steps. Tooltip already renders as a bottom sheet on ≤640px (existing engine).
- **Non-authed user lands on `/app`**: AppHome already redirects via `useAuthSession`, so AppTour just no-ops.
- **`/tour-lab` keeps working**: untouched; still uses its own local `TourProvider`, which simply nests inside the global one harmlessly because each `useTour()` call resolves to the nearest provider.

## Acceptance

- Sign up fresh → land on `/app` → welcome modal appears → 5-step tour runs → finish → reload `/app` → tour does NOT reappear.
- Skip mid-tour → reload → tour does NOT reappear.
- Open profile menu → "Replay product tour" → tour runs immediately (no welcome modal).
- Existing user who has a profile with score < 30 (sees OnboardingChecklist instead of panes) → tour skips the missing pipeline/practice steps without breaking.
- Mobile viewport → tour skips the search step, tooltip shows as bottom sheet.
- `/tour-lab` still works exactly as before.

## Out of scope

- Database column for `onboarding_tour_completed_at` (covered by localStorage; can be added later if needed for cross-device persistence).
- Per-page contextual mini-tours (`/the-bar` first visit, `/directory` first visit, etc.) — separate followup.
