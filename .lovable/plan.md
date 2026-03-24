

# Add "Coming Soon" Tool Cards to Catalogue

## Summary

Add 6 new tool cards to the catalogue grid for startups, artists, singers, and small companies. These will be visually distinct with a "COMING SOON" badge and non-clickable (greyed out / locked appearance).

## Changes

### Edit `src/pages/Tools.tsx`

**Extend `TOOL_CATALOG`** with 6 new entries, each having a `comingSoon: true` flag:

| # | Tool | Tags | Description |
|---|------|------|-------------|
| 05 | Founder Agreement | Startups, Equity, Vesting | Co-founder equity splits, vesting schedules, and IP assignment clauses |
| 06 | Freelancer Contract | SMBs, IP, Payments | Service agreements with payment terms, IP ownership, and liability caps |
| 07 | Music Licensing Agreement | Artists, Royalties, Sync | Sync licensing, royalty splits, and territory-based distribution rights |
| 08 | Artist Commission Contract | Creators, IP, Milestones | Commission scope, revision limits, usage rights, and payment milestones |
| 09 | Terms of Service Generator | Startups, SaaS, E-commerce | Website/app ToS with liability limitations and dispute resolution |
| 10 | Equity & ESOP Template | Startups, ESOPs, Vesting | Employee stock option plans with cliff periods and exercise terms |

**Styling changes:**
- Add a `.coming-soon` modifier class on catalogue cards
- "COMING SOON" pill badge positioned at top-right corner (yellow bg, black text, small caps)
- Card has reduced opacity (~0.6), no hover lift, `cursor: default`
- "Open Tool" arrow replaced with "Coming Soon" text
- Grid stays responsive `auto-fill, minmax(280px, 1fr)` to handle 10 cards nicely (was fixed 2-col)

**No logic changes** to the existing 4 working tools. Coming-soon cards simply don't call `openTool`.

## Files

| Action | File |
|--------|------|
| Edit | `src/pages/Tools.tsx` — extend catalogue array, add coming-soon card styles |

