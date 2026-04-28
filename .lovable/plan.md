# Morph Dock — 9th variant in `/dock-lab`

A single shape-shifting dock that morphs between 5 forms based on context. Built as a sandbox variant first so you can feel each state before promoting to production.

## The morph states

One dock, five moods. Identity is preserved by keeping the **2px black border + hard yellow shadow** constant across every state — only shape, width, and contents morph.

| State    | Looks like                                | Triggered by (in /dock-lab via section toggle) |
|----------|-------------------------------------------|------------------------------------------------|
| `hidden` | Vanished entirely (translateY off-screen) | "Hero" toggle — simulates home hero in view    |
| `pill`   | Compact pill, 6 nav icons (today's dock)  | "Browse" toggle — neutral browsing             |
| `split`  | Two pills: 3 nav + Join Waitlist CTA      | "Convert" toggle — conversion mode             |
| `search` | Wide search bar with `/` shortcut chip    | "Directory" toggle — search-first surface      |
| `orb`    | 64px FAB bottom-right, fans out icons     | "Practice" toggle — The Bar style              |

The dock-lab section toggle becomes the *driver* for the morph state, so you can flip between all 5 forms and watch the animation between any pair.

## Animation

`framer-motion` with `layout` + `LayoutGroup`:
- Border-radius, width, height, position, and contents all tween via `motion.div layout`.
- Duration ~280ms, `ease: [0.32, 0.72, 0, 1]` (Apple-style spring-ish ease).
- Contents inside crossfade with `AnimatePresence mode="wait"` so icons don't smear during the morph.
- The `hidden` state = `animate={{ y: 100, opacity: 0 }}` — slides down out of view.
- The `orb` state moves anchor from `left:50% center` to `right:24px`, animated as part of the same layout transition.

`framer-motion` is not currently in the project — this plan adds it as a dependency (`bun add framer-motion`). It's ~30kb gzipped and lazy-loadable; only the Morph Dock variant imports it, so it doesn't bloat the production bundle.

## Files

**New: `src/components/dock-lab/variants/MorphDock.tsx`**
- Self-contained component.
- Accepts no props; reads its current state from a local `useState<"hidden"|"pill"|"split"|"search"|"orb">`, defaults to `pill`.
- Renders a row of 5 small chip buttons above the dock to toggle between morph states (sandbox-only control, gives you a single page to feel every transition).
- Renders the morphing dock itself using `motion.div` with `layout` and a switch on the active state.

**Edit: `src/components/dock-lab/DockLabShell.tsx`**
- Import `MorphDock`.
- Add as 9th entry in `VARIANTS` at the top of the list (above "Current Dock") with description: *"Single dock that morphs shape based on context — pill, split, search, orb, or hidden."*

**No changes to:**
- Production `MobileBottomDock` — untouched.
- `App.tsx`, `Layout.tsx`, routing, anything else.
- The 8 existing dock-lab variants.

## Out of scope (next round, after you pick this)
- Wiring real route → state mapping (e.g. Directory auto-triggers `search`, The Bar auto-triggers `orb`).
- Auto-vanish on input focus or hero-in-view.
- Promoting Morph Dock to replace `MobileBottomDock` site-wide.

Once you've played with it in `/dock-lab` and it feels right, we can do the production wiring in a focused follow-up.