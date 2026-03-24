

## Make Playbook Intro Bold & Visually Exciting

### Problem
The empty state intro is too small, too generic, and uses plain fonts — feels like a placeholder, not a landing moment.

### Design Direction
Transform it into a dramatic, high-impact hero with:
- **Massive heading** using Sora font at 5xl/6xl with the gold accent on key words
- **Typewriter-style monospace case number** (e.g. "CASE FILE // LX-000") above the heading for thematic flavor
- **Bigger, bolder feature cards** with gold borders and larger icons
- **Animated gold line** that expands on load
- **Stronger tagline** with larger text and more contrast
- **Pulsing gold dot** next to the prompt instead of plain text

### Changes

| File | What |
|------|------|
| `src/pages/Playbook.tsx` | Redesign the empty state block (lines 205-243) |

### Specifics

**Layout redesign (lines 205-243):**
- Top: `font-mono text-xs tracking-[0.3em] uppercase text-[#D4A017]/60` — "CASE FILE SYSTEM // LX-000"
- Heading: `text-5xl md:text-6xl font-bold` with "Locus" in white and "Playbook" in `text-[#D4A017]`, using Sora (already the heading font)
- Gold bar: `h-1.5 w-32` instead of `h-1 w-20`
- Tagline: `text-lg` instead of `text-base`, slightly brighter color
- Feature cards: larger padding (`p-6`), bigger icons (`w-8 h-8`), `text-base` labels, gold left border accent (`border-l-2 border-[#D4A017]`), left-aligned text instead of centered
- Prompt: add a pulsing gold dot (`w-2 h-2 rounded-full bg-[#D4A017] animate-pulse`) next to bolder text

