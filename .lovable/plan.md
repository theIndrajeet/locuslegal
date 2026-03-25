

# Add Feature Voting System (Heart Icon)

## Summary

Add a heart-icon voting system for all "Coming Soon" items across three pages: **Tools** (6 items), **Resources** (2 items), and **Playbook** (attachments). Only logged-in users can vote; vote counts are visible to everyone.

## Database

### New table: `feature_votes`
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK → profiles, not null)
- `feature_key` (text, not null) — unique identifier like `tool-05`, `resource-cv-analyser`, `playbook-att-LX-011-cv-screening`
- `created_at` (timestamptz, default now())
- Unique constraint on `(user_id, feature_key)` — one vote per user per feature

### RLS policies
- SELECT: anyone (public can see vote counts)
- INSERT: authenticated, where `auth.uid() = user_id`
- DELETE: authenticated, where `auth.uid() = user_id` (to un-vote)

## New shared hook: `src/hooks/useFeatureVotes.ts`
- Fetches all vote counts grouped by `feature_key` in one query
- Fetches current user's votes (if logged in) to show filled hearts
- Provides `toggleVote(featureKey)` — inserts or deletes vote; redirects to `/auth` if not logged in
- Returns `{ voteCounts, userVotes, toggleVote, loading }`

## Page changes

### `src/pages/Tools.tsx`
- On each coming-soon card, add a heart icon + count in the bottom-right area (next to "Coming Soon" text)
- Heart filled = user voted, outline = not voted
- Clicking heart calls `toggleVote('tool-{num}')`

### `src/pages/Resources.tsx`
- On each coming-soon card, add heart + count below the "Coming Soon" button
- Feature keys: `resource-cv-analyser`, `resource-book-session`

### `src/pages/Playbook.tsx`
- On coming-soon attachment rows, add heart + count next to the "Coming Soon" badge
- Feature keys derived from case number + attachment label

## Files

| Action | File |
|--------|------|
| Migration | Create `feature_votes` table with RLS |
| Create | `src/hooks/useFeatureVotes.ts` |
| Edit | `src/pages/Tools.tsx` — add heart to coming-soon cards |
| Edit | `src/pages/Resources.tsx` — add heart to coming-soon cards |
| Edit | `src/pages/Playbook.tsx` — add heart to coming-soon attachments |

