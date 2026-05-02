## Make Share + Delete (X) buttons more prominent on vacancy cards

Right now both the Share and X buttons in `src/components/vacancies/VacancyCard.tsx` are rendered as bare 12px ghost icons — they blend into the muted-foreground status text and are easy to miss (visible in the screenshot).

### Change
Restyle both icon buttons in the card footer to match the project's neobrutalist language used elsewhere on the card:

- 28x28 px square (`h-7 w-7`), centered icon at 14px, `strokeWidth={2.5}` for visual weight.
- 2px border + hard 2px box-shadow (`shadow-[2px_2px_0_0_...]`).
- Hover: translate down-right by 1px and shrink shadow to 1px (the same press-effect the "Draft application" button already uses).
- **Share button:** foreground border + accent yellow hover fill.
- **Delete (X) button:** destructive (red) border, destructive icon color, full destructive fill on hover. Stays distinguishable from share.
- Truncated text now sits next to two clearly tappable chips, fixing the cramped "time to nu... [share] [x]" overflow seen on mobile.

No layout/copy changes. Only the two button class strings + icon size/strokeWidth update.

### Out of scope
- Confirm dialog text and behavior stay as-is.
- The follow-up "time to nudge" status text is unchanged (it can still truncate; the chips no longer compete with it for attention).