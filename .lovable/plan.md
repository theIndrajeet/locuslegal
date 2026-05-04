# Product Tour — Demo Page First

Build a standalone demo at `/tour-lab` where we can perfect the spotlight tour mechanics and visuals against fake UI. Once you sign it off, we wire the same engine into the real app (`/app`, post-signup trigger, profile menu replay, DB persistence).

## Why a demo page first
- No auth/DB coupling — pure UI playground.
- We can iterate on tooltip styling, spotlight cutout, animation, keyboard behaviour without touching production flows.
- Acts as a permanent internal QA page (like `/dock-lab`).

## What gets built

### 1. Route + page: `/tour-lab`
A fake "dashboard" mock screen with 5 dummy target zones laid out like the real `/app`:
- A "Profile strength" card (top-left)
- A "Pipeline" panel (center)
- A "The Bar" entry tile (right)
- An "Opportunities" strip (bottom)
- A fake Cmd+K search button (top bar)

Each zone gets a `data-tour="profile" | "pipeline" | "bar" | "opportunities" | "search"` attribute so the tour engine can find it.

Page also has a control bar at the top:
- **Start tour** button
- **Reset** button (clears localStorage flag for the demo)
- Step counter readout
- Toggle: "Show welcome modal first" (on/off)

### 2. The tour engine (reusable)
Three files, all framework-agnostic so we can lift them into `/app` later untouched:

**`src/components/tour/TourProvider.tsx`** — Context provider holding current step index, running state, and `start() / next() / back() / skip() / finish()` methods. Listens for `Esc` (skip), `→` / `Enter` (next), `←` (back).

**`src/components/tour/TourOverlay.tsx`** — Portal-rendered overlay:
- Dark dim layer (`bg-black/70`) covering the whole viewport
- A **spotlight cutout** over the active target — implemented with an SVG mask (one big rect minus the target's bounding rect, with ~8px padding and rounded corners). This is the cleanest way to get a real "hole" in the dim layer.
- Yellow neobrutalist border drawn around the target (`border-2 border-accent` via an absolutely positioned div, hard shadow).
- Tooltip card positioned next to the target (smart placement: tries bottom, then top, then right, then left based on viewport space).
- Tooltip content: Sora heading, Inter body, step counter ("2 of 5"), Back / Skip / Next buttons. Last step shows "Finish".
- Recomputes target position on `resize`, `scroll`, and via `ResizeObserver` on the target.
- Respects `prefers-reduced-motion` (instant transitions instead of animated).

**`src/components/tour/WelcomeModal.tsx`** — Optional pre-tour modal. Full-screen on mobile, centered card on desktop. 3-4 swipeable slides ("Apply", "The Bar", "Opportunities", "Profile") with Sora headings, Lucide icons, "Skip" + "Take the tour" CTAs. Neobrutalist styling — yellow accent borders, hard shadows, no emojis.

### 3. Tour step definitions for the demo
Defined inline on the demo page as a typed array:
```ts
const demoSteps: TourStep[] = [
  { target: '[data-tour="search"]', title: 'Search anything', body: 'Press Cmd+K to jump anywhere — firms, guides, opportunities.', placement: 'bottom' },
  { target: '[data-tour="profile"]', title: 'Build your profile', body: 'A complete profile gets 3× more responses from firms.', placement: 'right' },
  { target: '[data-tour="pipeline"]', title: 'Track applications', body: 'Log every application here. Locus nudges you when to follow up.', placement: 'top' },
  { target: '[data-tour="bar"]', title: 'The Bar', body: 'Daily legal challenges. Climb the leaderboard, prove your skill.', placement: 'left' },
  { target: '[data-tour="opportunities"]', title: 'Opportunities', body: 'Vacancies, CFPs, moots, competitions — all in one feed.', placement: 'top' },
];
```

### 4. Persistence (demo-only, simple)
For the demo: just `localStorage.tour_lab_completed` so Reset works. The real `/app` integration will use a `profiles.onboarding_tour_completed_at` column — out of scope for this build.

## Visual spec
- Dim: `bg-black/70 backdrop-blur-[2px]`
- Spotlight border: `border-2 border-accent` (yellow), `shadow-[4px_4px_0_0_hsl(var(--accent))]`
- Tooltip card: `bg-card border-2 border-foreground/80 rounded-2xl p-5 shadow-[6px_6px_0_0_hsl(var(--accent))]`, max-width 360px
- Heading: Sora, `text-base font-extrabold uppercase tracking-wider`
- Body: Inter, `text-sm text-muted-foreground`
- Step counter: mono, `text-[10px] uppercase tracking-wider text-accent`
- Buttons: existing neobrutalist `Button` variants (Skip = ghost, Back = outline, Next = default/accent)
- Zero emojis. Lucide icons only (`ArrowRight`, `ArrowLeft`, `X`).
- Animations: tooltip fade+translate-2 on enter (150ms), spotlight position transitions (200ms ease-out). Both disabled under `prefers-reduced-motion`.

## Mobile behaviour (≤640px)
- Tooltip becomes a bottom sheet instead of floating (full-width, attached to bottom edge).
- Spotlight border stays around the target, but tooltip no longer tries smart placement.
- Step counter + buttons sit in the sheet.

## Files added
- `src/pages/TourLab.tsx`
- `src/components/tour/TourProvider.tsx`
- `src/components/tour/TourOverlay.tsx`
- `src/components/tour/WelcomeModal.tsx`
- `src/components/tour/types.ts` (`TourStep`, placement enum)

## Files edited
- `src/App.tsx` — add `<Route path="/tour-lab" element={<TourLab />} />` (lazy-loaded like other lab routes)

## Out of scope (explicitly, for later)
- Auto-trigger after first signup
- `profiles.onboarding_tour_*` DB columns
- "Replay tour" entry in Profile menu
- Wiring to real `/app` targets
- Per-page contextual tours (`/the-bar`, `/opportunities`, `/directory`)

## How we'll iterate
You open `/tour-lab`, hit **Start tour**, and tell me what to fix — spacing, copy, tooltip placement, animation speed, mobile behaviour. Once it feels right, I'll do the integration build as a separate task.

## Acceptance for this build
- `/tour-lab` loads with the fake dashboard mock.
- "Start tour" runs all 5 steps with smooth spotlight transitions.
- Esc skips, arrow keys navigate, Skip + Back + Next all work.
- Welcome modal toggle works.
- Tooltip never overflows the viewport on 320px width.
- Reset button restores initial state.
- Zero TypeScript errors, zero console warnings.
