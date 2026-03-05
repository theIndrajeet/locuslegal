

## Integrate DisplayCards Component

The component code you pasted had its JSX tags stripped. I will reconstruct the full component based on the visible class names, props, and structure, then integrate it into the project.

### What will be done

1. **Create `src/components/ui/display-cards.tsx`** - The DisplayCards component with proper JSX restored. Each card renders a styled div with icon, title, description, and date. Cards stack using CSS grid with `[grid-area:stack]` and fan out with translate transforms. Hover effects remove grayscale and overlay.

2. **Use in the Hero section or ForStudents section** - Place the DisplayCards alongside existing content to add visual flair. Based on the screenshot showing "YOUR MERIT. YOUR INTERNSHIP.", this likely goes near the Hero area.

### Technical details

- No new dependencies needed (`lucide-react` already installed, `cn` utility exists)
- Remove `"use client"` directive (not needed in Vite/React)
- The component uses Tailwind pseudo-element classes (`before:`) for overlay effects and `grayscale` filters
- Cards use CSS Grid stacking (`[grid-area:stack]`) with incremental `translate-x`/`translate-y` offsets

### Question

Where exactly would you like the DisplayCards placed? Options include: beside the Hero text, in the ForStudents section, or as a standalone section. I'll default to placing it in the Hero section on the right side if no preference is given.

