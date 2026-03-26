

## Plan: Add Founder Note to the Platform

### What
Add a warm, personal "founder note" strip just above the footer branding — a single line that humanizes the platform: *"Built by your senior — a law grad, frustrated with how internships work in India."*

### Where
In `src/components/Footer.tsx`, between the gradient separator and the branding block. This keeps it visible on every page without cluttering the hero or main content.

### Design
- Centered text, small/medium size, italic styling
- Muted foreground color with a subtle accent on "your senior"
- A small `👋` or `Heart` icon for warmth
- Sits in a compact `py-6` section, blending naturally with the footer

### Change
**File: `src/components/Footer.tsx`**
- Insert a new `<div>` block after the gradient separator (line 20) and before the branding block (line 23)
- Content: `"Built by your senior — a law grad, frustrated with how internships work in India."`
- Style: `text-sm text-muted-foreground italic text-center` with "your senior" in `text-accent font-semibold`

Single file, ~5 lines added.

