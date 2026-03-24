

## Replace Empty State with Animated Playbook Introduction

### What
Replace the "Select a guide to preview" empty state in the right panel with an engaging, animated introduction that explains what the Locus Playbook is. This turns dead space into a compelling onboarding moment.

### Design

The empty state becomes a rich intro panel with staggered fade-in animations:

1. **Hero heading**: "The Locus Playbook" in large bold text with a gold accent underline, fading in first
2. **Tagline**: "Your case file system for navigating legal internships in India." — fades in with slight delay
3. **Three feature cards** staggered in, each with an icon + short description:
   - **14 Guides** — "Covering every stage from application to PPO conversion"
   - **3 Audiences** — "Tailored for students, firms, and institutions"
   - **Actionable** — "Step-by-step sections you can use right away"
4. **Prompt**: A subtle pulsing arrow or text at the bottom — "Select a guide from the left panel to get started"
5. **Background accent**: A subtle gold-tinted radial gradient behind the content for depth

All animations use CSS keyframes (fade-in + translateY) with staggered `animation-delay` values — consistent with the site's existing animation system.

### Changes

| Action | File |
|--------|------|
| Edit | `src/pages/Playbook.tsx` — replace the empty state div (lines 204-207) with a new `PlaybookIntro` component |

The `PlaybookIntro` component will be defined in the same file (internal component like `GuideDetail`). It uses:
- Tailwind `animate-fade-in` class with inline `animationDelay` for staggering
- `BookOpen`, `Users`, `Layers` icons from lucide-react (already imported)
- Gold accent color consistent with the rest of the page

