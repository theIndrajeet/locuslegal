

## Fix: GooeyText Animation Causing Page Layout Shift

### Problem
The `GooeyText` component morphs between phrases of different lengths ("not the one your college got you.", "based on your skills, not your campus.", "earned through merit, not connections."). Each phrase has a different character count, causing the `h1` container to resize dynamically, which pushes all content below it up and down.

### Solution
Give the `GooeyText` wrapper a fixed minimum height so the tallest phrase is always accommodated. This prevents the `h1` from reflowing on each morph.

### Changes

**`src/components/Hero.tsx`** — Add a `min-h` class to the GooeyText `className` prop to reserve space for the tallest phrase. Use responsive min-heights matching the text sizes (e.g., `min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[200px]`). Also add `block` display so the min-height applies correctly.

This is a single-line className change — no other files affected.

