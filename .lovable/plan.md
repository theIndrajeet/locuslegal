# Fix: swap CTA on the actual homepage hero

I edited the wrong hero file last time — the homepage uses `RotatingHero.tsx`, not `HomeHero.tsx`. That's why your screenshot still shows "Join the Waitlist".

## Change

`src/components/home/RotatingHero.tsx` (lines 124–136), primary button only:

- **Before:** `Join the Waitlist` → `/waitlist`
- **After:** `Start your journey` → `/auth`

Secondary button (`Explore Locus` → `/directory`) stays exactly as-is.

That's the entire fix — one button label + one link target.
