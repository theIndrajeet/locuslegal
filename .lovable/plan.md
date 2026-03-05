

## Replace "Your merit. Your internship." Badge with Rainbow Button

The gold pill badge at line 20-26 in `Hero.tsx` will be replaced with the `RainbowButton` component, giving it an animated rainbow border effect.

### Changes

1. **Create `src/components/ui/rainbow-button.tsx`** — Copy the provided RainbowButton component (remove `"use client"` since this is Vite).

2. **Add CSS variables to `src/index.css`** — Add the rainbow color variables to both `:root` and `.dark` blocks:
   ```css
   --color-1: 0 100% 63%;
   --color-2: 270 100% 63%;
   --color-3: 210 100% 63%;
   --color-4: 195 100% 63%;
   --color-5: 90 100% 63%;
   ```

3. **Extend `tailwind.config.ts`** — Add the rainbow colors, animation, and keyframes to the existing config:
   - Colors: `color-1` through `color-5`
   - Animation: `rainbow: "rainbow var(--speed, 2s) infinite linear"`
   - Keyframe: `rainbow` (0% → 200% background-position)

4. **Update `src/components/Hero.tsx`** — Replace the `<span>` badge (lines 20-26) with:
   ```tsx
   <RainbowButton className="mb-8 font-heading text-sm font-semibold tracking-widest uppercase">
     Your merit. Your internship.
   </RainbowButton>
   ```
   The button won't navigate anywhere — it's purely decorative like the current badge.

No new dependencies needed. All required packages are already installed.

