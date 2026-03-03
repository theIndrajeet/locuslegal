

# Replace Shader Background with BackgroundPaths Component

## What Changes

Replace the Three.js aurora shader with the `BackgroundPaths` framer-motion component as the Hero background. The BackgroundPaths component renders animated SVG curves — lighter weight than WebGL and visually distinctive.

## Steps

### 1. Install `framer-motion`
Already have `@radix-ui/react-slot` and `class-variance-authority`. Only need `framer-motion`.

### 2. Create `src/components/ui/background-paths.tsx`
The provided component adapted for this project:
- Strip `"use client"` directive (not Next.js)
- Use it as a background-only component — remove the built-in title/button content since Hero already has its own content
- Adapt path colors to use the dark theme palette (`rgba(15,23,42,...)` works with the `#0F172A` dark bg)

### 3. Update `src/components/Hero.tsx`
- Replace `AnimatedShaderBackground` import with `BackgroundPaths` (used as background layer only — the `FloatingPaths` portion)
- Keep the existing Hero content (badge, headline, CTAs) on top with `z-10`
- Keep the dark overlay for text readability

### 4. Remove or keep `animated-shader-background.tsx`
Remove it since it's no longer used — eliminates the `three` dependency overhead.

### Files
- **New:** `src/components/ui/background-paths.tsx`
- **Edit:** `src/components/Hero.tsx` — swap background
- **Delete:** `src/components/ui/animated-shader-background.tsx` (optional cleanup)
- **Edit:** `package.json` — add `framer-motion`

