# Dock Lab — Demo Playground

A hidden, link-only page at **`/dock-lab`** where you can preview all 7 mobile-dock concepts live, switch between them with a top selector, and feel the interactions on a real mobile viewport. Nothing on this page touches the production `MobileBottomDock` — it's a pure sandbox.

## What you'll see

A single scrollable page (so scroll-based behaviors actually fire) with:

- **Top control panel** (sticky): pill selector to swap between concepts + a short description of the active one + a "view on mobile" hint.
- **Fake page content** below: hero, a few cards, a long list — enough scroll length to trigger auto-hide and feel real.
- **Active concept** rendered fixed at the bottom (or wherever it lives), fully interactive.
- All 7 concepts share the same nav targets (Home, Directory, Playbook, Resources, Tools, The Bar) but route to `#` so you stay on the lab page.

## The 7 concepts (each as its own component)

1. **Current Dock** (baseline) — the existing glassmorphic pill, for comparison
2. **Locus Orb** — yellow neobrutalist FAB bottom-right, taps fan icons in an arc
3. **Command Bar** — single `[ Search Locus… ]` pill, opens a full-screen sheet
4. **Swipeable Dock** — pill showing 4 icons at a time, swipe to reveal more
5. **Contextual Dock** — content adapts to a fake "current section" toggle
6. **Pull-up Drawer** — grab handle at bottom, drag/tap to reveal full menu sheet
7. **Split Dock** — left nav pill + right contextual action pill
8. **Edge Tab Bar** — full-width iOS-style bar flush to bottom with center "+" FAB

## How concepts are organized

```text
src/pages/DockLab.tsx                  ← the demo page
src/components/dock-lab/
  DockLabShell.tsx                     ← selector + fake content
  variants/
    CurrentDock.tsx
    OrbDock.tsx
    CommandBarDock.tsx
    SwipeableDock.tsx
    ContextualDock.tsx
    PullUpDrawerDock.tsx
    SplitDock.tsx
    EdgeTabBarDock.tsx
  shared/navItems.ts                   ← single source for icons/labels
```

Each variant is self-contained (own state, own animations) so swapping is instant and they can't interfere with each other.

## Access & safety

- Route added to `src/App.tsx` as `/dock-lab` — **not linked anywhere** in the app, only reachable by typing the URL.
- `usePageMeta` sets `noindex` so it never hits search.
- The real `MobileBottomDock` is **hidden** on this route (same regex pattern we already use for CompareBar) so it doesn't fight the demo.
- Desktop shows a "best viewed on mobile / resize your window" notice but still renders so you can preview from your laptop.

## Visual spec (consistent across variants)

- Neobrutalist: 2px black borders, hard `4px 4px 0 0` yellow shadows where it fits the variant
- Yellow `#FACC15` accent for active/CTA, white icons on black, Sora for any labels
- All transitions 150–250ms, no bouncy springs
- Zero emojis (Lucide only): Home, Building2, BookOpen, Library, Wrench, Gavel, Search, Plus, Bell, User

## Out of scope (intentionally)

- No analytics / no persistence of "selected concept"
- No swap into production — that's a separate decision after you pick a winner
- No new auth, DB, or routes beyond `/dock-lab`

Approve and I'll build it.
