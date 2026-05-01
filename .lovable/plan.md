# CTA hierarchy refresh (final)

Two surgical edits to the homepage CTA blocks. No new components, no logic, no route changes.

## 1. HomeHero — `src/components/home/HomeHero.tsx` (top of `/`)

Current buttons:
- Primary (yellow): Join the Waitlist → `/waitlist`
- Secondary (dark): Explore features → `#features`

After:
- **Primary (yellow): Start your journey →** → `/auth` (login / sign-up)
- **Secondary (dark): Explore Locus** → `#features`

Waitlist link removed from this block.

## 2. FinalCTA — `src/components/home/FinalCTA.tsx` (bottom of `/`)

Current: single yellow "Join the Waitlist →" button.

After (two prominent buttons, side-by-side, matching the hero pattern):
- Heading unchanged: **"Get in early. Get in front."**
- Subcopy unchanged (still mentions the waitlist — keeping it because the primary CTA is the waitlist).
- **Primary (yellow): Join the Waitlist →** → `/waitlist`
- **Secondary (dark): Explore Locus** → `#features`
- Layout: `flex flex-col sm:flex-row gap-4 justify-center` — same row pattern as HomeHero so both buttons read as equally weighty (size `lg`, same padding).

## Technical notes

- Both files already import `Link`, `Button`, and `ArrowRight`. No new imports.
- `/auth` route already exists in `src/App.tsx`; same destination used by `ProfileMenu` for sign-in.
- `TimelineContent` animation wrappers preserved in both files.
- No copy changes anywhere else. `/waitlist` page, navbar, and `RainbowButton` chips untouched.
