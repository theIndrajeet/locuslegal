## Vacancy card footer cleanup

In `src/components/vacancies/VacancyCard.tsx` (lines 190–212):

1. Remove the fallback `<span>Apply by email</span>` text — leave the slot empty when there's no source credit / application status.
2. Soften the share button to a borderless icon-only ghost (no heavy black border + offset shadow), matching the lighter feel of the row:
   - `text-muted-foreground hover:text-accent hover:bg-accent/10`
   - keep size `h-7 w-7`, `Share2 size={14} strokeWidth={2}`

Result: clean footer with just status/credit text on the left and a subtle share icon — no awkward "Apply by email" label, no chunky neobrutalist button.