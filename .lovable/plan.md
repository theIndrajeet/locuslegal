

# Integrate GooeyText into Hero Accent Text

## What it does
Replace the static accent text `"not the one your college got you."` in the Hero headline with the `GooeyText` morphing component, cycling through multiple punchy phrases in gold/accent color.

## Steps

### 1. Create `src/components/ui/gooey-text-morphing.tsx`
The provided component as-is, with `"use client"` stripped. No new dependencies needed — it's pure React refs + `requestAnimationFrame`.

### 2. Edit `src/components/Hero.tsx`
- Import `GooeyText`
- Replace the `<span className="text-accent">not the one your college got you.</span>` with a `GooeyText` component
- Pass an array of rotating phrases, e.g.:
  - `"not the one your college got you."`
  - `"based on your skills, not your campus."`
  - `"earned through merit, not connections."`
- Style with `textClassName="text-accent"` and size classes matching the heading (`font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl`)
- The GooeyText needs to sit inline within the `<h1>` — will wrap it in a block-level span so the morphing text flows below the static "Get the internship you deserve —" line

### Files
- **New:** `src/components/ui/gooey-text-morphing.tsx`
- **Edit:** `src/components/Hero.tsx` — swap static accent span for GooeyText

