

## Rename "Firm" → "Firm / Chamber", Proofread, and Optimize for Sign-Ups

### 1. Rename "Firm" → "Firm / Chamber" across the site

**`Hero.tsx`** line 65: "I'm a Firm" → "I'm a Firm / Chamber"

**`Navbar.tsx`** line 7: "Firms" → "Firms & Chambers"

**`ForFirms.tsx`**:
- Section label (line 65) already says "For Law Firms & Chambers" — good
- Line 165 CTA: "List My Firm →" → "List My Firm / Chamber →"

**`WaitlistSection.tsx`**:
- Line 135: "For Firms" → "For Firms / Chambers"
- Line 148 placeholder: "Firm name" → "Firm / Chamber name"

### 2. Proofreading fixes

- **WaitlistSection.tsx** line 71: "Lex Root" → "LexRoot" (two-word inconsistency with rest of site)
- **Footer.tsx** line 14: "Lex Root" → "LexRoot"
- All other copy is clean — spelling, grammar, and punctuation checked across all 8 files.

### 3. Sign-up optimization tweaks

Make CTAs more urgent and conversion-focused:

**Hero.tsx**:
- Line 53 subtext: append "Sign up now — spots are limited." to the end
- Wrap "I'm a Student" button in the `default` (yellow) variant to make the primary CTA pop (already is)

**ForStudents.tsx**:
- Line 42 CTA: "Join as a Student" → "Join the Waitlist — It's Free →"

**ForFirms.tsx**:
- Line 161 subtext: "It takes 5 minutes. And the next great hire might already be on the platform." → "It takes 5 minutes. Your next great intern might already be waiting."

**ForUniversities.tsx**:
- Line 219 microcopy: Add "Join 50+ institutions already signed up." (social proof nudge)

**WaitlistSection.tsx**:
- Line 68 heading: "Join the Waitlist" → "Join the Waitlist — Limited Early Access"
- Line 70 subtext: "Be among the first to access LexRoot when we launch." → "Early access members get priority placement. Don't miss your spot."

