

## Add "I'm a School" Button + University Waitlist Form

### Changes

**1. `src/components/Hero.tsx`** — Add a third CTA button "I'm a School" (using `variant="neutral"`) next to the existing two buttons, linking to `#waitlist`.

**2. `src/components/WaitlistSection.tsx`** — Expand from a 2-column to a 3-column grid (`md:grid-cols-3`) and add a third form card "For Universities" with fields:
- Email address
- Institution name
- City
- Select: Institution type (Law College / University / Deemed University)
- Submit button: "Register My Institution"
- Same card styling, animation variants, and localStorage pattern as the other two forms
- Toast: "You're on the list! 🎉" with description "We'll reach out about partnership options."

