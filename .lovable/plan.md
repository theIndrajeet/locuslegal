

# Visual Revamp + Animated Shader Background

## Problem
The current landing page looks generic/AI-generated — uniform spacing, predictable card layouts, default styling patterns. We need to add visual distinction and integrate the Three.js shader background.

## Plan

### 1. Install `three` dependency
Already have `lucide-react`. Need to add `three` (v0.133+).

### 2. Create `src/components/ui/animated-shader-background.tsx`
Adapt the provided component — strip out the unused Lucide imports and the inner content div. Export just the shader canvas as a reusable background component that renders a full-screen aurora effect behind content.

### 3. Integrate shader background into Hero section
- Place the `AnimatedShaderBackground` as a full-bleed `position: absolute` layer behind the Hero content
- Add a dark overlay gradient so text remains readable on top of the aurora
- Remove the plain background, let the shader create visual drama
- Content sits on top with `position: relative` and `z-10`

### 4. Visual revamp across all sections
Key changes to break the "AI-made" feel:

**Hero:**
- Shader background makes it immediately unique
- Asymmetric text alignment (left-aligned on desktop instead of centered)
- More dramatic typography sizing with tighter letter-spacing
- Staggered fade-in animations on badge → headline → subtext → CTAs

**Navbar:**
- Add a subtle glassmorphism effect with more prominent blur
- Slightly reduce padding for a tighter, more editorial feel

**Stats Bar:**
- Add subtle gradient border-top/bottom lines using accent color
- Make the numbers larger with a mono-style weight contrast

**Feature Cards (Students & Firms):**
- Add subtle hover lift with shadow transition (not just border color)
- Stagger card entry animations
- Add accent gradient line at top of each card

**Waitlist Section:**
- Add a subtle background pattern or gradient
- Style form inputs with more personality (rounded corners, focus glow)

**Footer:**
- Add a subtle top gradient separator instead of plain border

### 5. Add `@keyframes float` to index.css
As specified in the provided code.

### Files to create/modify
- **New:** `src/components/ui/animated-shader-background.tsx`
- **Edit:** `src/components/Hero.tsx` — shader bg + left-align + stagger animations
- **Edit:** `src/components/Navbar.tsx` — glassmorphism refinement
- **Edit:** `src/components/StatsBar.tsx` — typography punch
- **Edit:** `src/components/ForStudents.tsx` — card hover effects, stagger
- **Edit:** `src/components/ForFirms.tsx` — card hover effects, stagger
- **Edit:** `src/components/WaitlistSection.tsx` — background treatment
- **Edit:** `src/components/Footer.tsx` — gradient separator
- **Edit:** `src/index.css` — float keyframe, utility classes
- **Edit:** `package.json` — add `three`

