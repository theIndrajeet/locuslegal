## Make "Suggest a fix" obvious + show what students can suggest

Currently it's a tiny grey link at the bottom of the firm drawer — easy to miss. Upgrade it to a proper neobrutalist call-out card that explicitly lists the kinds of corrections we accept, while keeping the same `setSuggestOpen(true)` action and existing `SuggestFixDialog` flow.

### Change in `src/components/FirmDrawer.tsx` (only the suggest-fix block, lines 190–200)

Replace the small ghost link with a full-width clickable card:

- Bold border-2 + 3px hard shadow (neobrutalist), shadow shifts to accent on hover.
- Yellow icon chip (`MessageSquarePlus`) + bold heading: **"Spot something wrong? Help us fix it"**
- One-line context: "You can suggest corrections for:"
- Pill chips listing example fields: **Wrong email · Tier (1-4) · Phone number · Closed firm**
- Footer micro-CTA in accent color: "Suggest a fix →"

No data, dialog, or schema changes — just visual prominence and education on what's suggestable.