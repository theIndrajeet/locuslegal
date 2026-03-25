

# Make The Bar Feed More Lively

The current feed cards are plain dark boxes with minimal visual hierarchy. This plan adds color, depth, and energy to make the feed feel like a vibrant community dashboard.

## Changes to `src/pages/TheBar.tsx`

### 1. Colorful left accent border on each card
- Each card gets a colored left border based on its audience type:
  - Student = yellow/accent
  - Firm = blue
  - Institution = purple
- Uses `border-l-4` with the audience color, replacing the uniform `border-border`

### 2. Gradient hover effects
- Cards get a subtle gradient overlay on hover (e.g., `hover:bg-gradient-to-r from-accent/5 to-transparent`)
- Active/hovered card gets a slight scale or glow effect

### 3. Vote count styling
- Votes > 0 get accent-colored text
- The chevron gets a hover animation (bounce)
- Add a subtle background circle behind the vote count

### 4. Richer card layout
- Show a preview of the question body (first ~100 chars) in muted text below the title
- Make the title slightly larger and bolder
- Add a subtle separator between metadata and tags

### 5. Answer count pill enhancement
- Answers > 0: green pill with a filled icon
- Zero answers: dim pill with "Be first to answer" text instead of "0 answers"

### 6. Tag badges with colored dots
- Add a small colored dot before each tag (matching its hash color) for extra visual pop

### 7. Empty state enhancement
- Add a more inviting empty state with color and a CTA button

### 8. Staggered entry animation
- Use the existing `useScrollReveal` pattern or simple CSS animation-delay to stagger cards fading in

## Files
| Action | File |
|--------|------|
| Edit | `src/pages/TheBar.tsx` — enhance feed card styling with colored accents, gradients, richer layout, animations |

