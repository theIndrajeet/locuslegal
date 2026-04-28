# Demo: two-pill scroll-collapsing dock

Add a new variant to Dock Lab so you can play with it before we ship it as the real dock.

## What gets built

A new `TwoPillDock` variant on `/dock-lab`:

```text
At rest:
┌──────────────────────────────────┐  ┌──────────┐
│  🏠  🏢  📖  📚  🔧  ⚖️          │  │  + Log   │
└── left pill (full nav, 6 icons) ─┘  └ right ───┘

Scrolling down:
┌──────┐                              ┌──────────┐
│  🏠  │ ← collapses to active icon   │  + Log   │
└──────┘                              └──────────┘

Scroll stops or scrolls up → left pill expands back.
```

## Behaviour

- **Left pill**: always present, all 6 nav icons. Active icon highlighted in accent.
- **Collapse trigger**: scroll down >8px → collapse to a circle showing only the active icon. Scroll up OR 600ms scroll-idle → expand. Tapping the collapsed circle also expands.
- **Right pill**: shows a contextual action. In the lab, a small chip-row above the dock lets you preview each route's action: `Join` (home), `Search` (directory), `Log` (app), `none` (the bar / playbook / resources / tools).
- **Search action**: tapping it opens a Radix `Sheet` from the bottom with an autofocused input (demo only — doesn't route anywhere).
- **Styling**: neobrutalist — `border-2 border-foreground`, `shadow-[3px_3px_0_0_hsl(var(--accent))]` on both pills.
- **Animations**: `framer-motion` `layout` for the width-shrink, fade for icons hiding/showing.

## Files

- `src/components/dock-lab/variants/TwoPillDock.tsx` — new variant.
- `src/components/dock-lab/DockLabShell.tsx` — register `TwoPillDock` at the top of the variants list so it's the default selection.

No changes to the real `MobileBottomDock` yet — once you approve the demo feel, I'll port it to production in a follow-up.