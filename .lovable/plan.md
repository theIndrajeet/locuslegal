## Goal
The current preview uses off-brand `blue-500`, `purple-500`, and `emerald-500` for CFPs, Moots, and Competitions. Brand identity is strictly **Black, White, Yellow (accent)**. Differentiate streams using **fill style** (solid / outline / tinted) instead of color hues.

## Changes

**File:** `src/components/opportunities-preview/sampleData.ts` — `STREAM_META`

| Stream | Pill style | Accent strip |
|---|---|---|
| Internship | Solid yellow (current) | Solid yellow |
| Job | Solid white-on-black (current) | Solid foreground |
| CFP | **Outlined yellow** (transparent bg, yellow border + text) | Yellow @ 60% opacity |
| Moot | **Outlined white** (transparent bg, fg border + text) | Foreground @ 70% |
| Competition | **Tinted yellow** (yellow @ 20% bg, yellow border + text) | Yellow → fg gradient |

This keeps each stream visually distinct via border weight, fill density, and gradient — without introducing any non-brand hues.

## Out of scope
- No card layout, typography, or filter-nav changes
- No changes to the live `/vacancies` page
