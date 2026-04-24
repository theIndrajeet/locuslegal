# Plan: Replace hero background with floating geometric shapes

## 1. Create `src/components/ui/shape-landing-bg.tsx`
A background-only component (no copy, no badge) with 5 floating blurred pill shapes.

- `ElegantShape` subcomponent: SVG-less approach — a rotated `div` with a gradient fill, blur, inner border, and a slow framer-motion `y` float (±15px, ~12s loop).
- Restyle to **strict Black/White/Yellow** palette:
  - 3 shapes use `bg-gradient-to-r from-white/[0.08] to-transparent`
  - 2 shapes use `bg-gradient-to-r from-accent/[0.14] to-transparent` (yellow)
  - **No** indigo/rose/violet/cyan/amber from original
- Entry animation: rotate + opacity fade-in via framer-motion (staggered delays 0.3s–0.7s).
- Honors `useReducedMotion`: static positions, no float loop.
- `aria-hidden`, `pointer-events-none`, `absolute inset-0 overflow-hidden`.
- Container has subtle `bg-gradient-to-br from-accent/[0.03] via-transparent to-white/[0.03]` overlay for depth.

Shape positions (matching the original's asymmetric composition, adapted):
| # | size | rotate | position | gradient |
|---|------|--------|----------|----------|
| 1 | 600×140 | -8° | left:-10%, top:15% | white |
| 2 | 500×120 | 15° | right:-5%, top:70% | accent (yellow) |
| 3 | 300×80  | -20° | left:5%, bottom:10% | white |
| 4 | 200×60  | 25° | right:15%, top:10% | accent (yellow) |
| 5 | 150×40  | -25° | left:20%, top:5% | white |

## 2. Update `src/components/home/RotatingHero.tsx`
- Remove `import { FallingPattern } from "@/components/ui/falling-pattern"`.
- Remove the `<FallingPattern>` element, the `bg-background/40` overlay, and the right-side yellow radial-gradient div (lines 30–39).
- Add `import ShapeLandingBg from "@/components/ui/shape-landing-bg"` and render it as the first child of `<section>`.
- Keep all copy, motion fades, and CTAs exactly as-is.
- Keep `relative min-h-[88vh] flex items-center overflow-hidden` on the section.

## 3. Don't touch
- `FallingPattern` component file stays (in case used elsewhere later).
- No other files change.

## Result
Hero gets a quiet, premium floating-shapes background in our Black/White/Yellow palette instead of the falling pattern + yellow blob. Reduced-motion users get static shapes. No layout shift, copy unchanged.
