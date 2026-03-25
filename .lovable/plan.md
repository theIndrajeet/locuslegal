

# Make The Bar Sidebar Colorful with Browse & Topics Sections

Match the reference screenshot: add **Browse**, **Topics**, and **Audience** sections with colorful styling and counts.

## Changes to `src/pages/TheBar.tsx`

### 1. Add `browseFilter` state and unanswered filtering
- New state: `browseFilter: "all" | "unanswered"` (default `"all"`)
- Apply in `filtered` computation: when `"unanswered"`, only show questions with `answer_count === 0`

### 2. Compute dynamic counts for sidebar
- `unansweredCount` from `questions.filter(q => (q.answer_count ?? 0) === 0).length`
- `tagCounts`: a `Record<string, number>` derived from all questions' tags
- Total questions count for "All Questions"

### 3. Restructure the `<aside>` into three labeled sections

**BROWSE** (top)
- "All Questions" with count badge — highlighted gold/accent when active
- "Unanswered" with count — muted when inactive

**TOPICS** (middle)
- Replace badge-style tags with a vertical list of `#TagName` entries
- Each tag gets a **unique color** (cycle through a palette of greens, blues, purples, pinks, oranges, reds — matching the reference's colorful hashtags)
- Right-aligned count for each tag
- Clicking filters by that tag (existing logic)

**AUDIENCE** (bottom, existing — restyle slightly)
- Keep "For Students", "For Firms", "For Institutions" as vertical list items
- Prefix labels with "For " to match reference

### 4. Colorful tag badges in question cards
- Assign each tag a consistent color from the same palette used in the sidebar
- Use a hash-based color assignment so colors are stable per tag name
- Apply colored text + border to `#Tag` badges in the feed cards (matching reference where tags like `#Internship`, `#Salary`, `#Corporate` each have distinct colors)

### 5. Add answer count badge styling
- Show answer count as a small badge like `"1 answer"` / `"0 answers"` with a green/accent tint when > 0

### 6. Show author name + time in feed cards
- Add `by **AuthorName**` and relative time to each card (already have the data from profiles join)

### Color palette for tags (consistent mapping):
```
const TAG_COLORS = [
  "text-green-400 border-green-400/30",
  "text-blue-400 border-blue-400/30",
  "text-purple-400 border-purple-400/30",
  "text-pink-400 border-pink-400/30",
  "text-orange-400 border-orange-400/30",
  "text-red-400 border-red-400/30",
  "text-cyan-400 border-cyan-400/30",
  "text-yellow-400 border-yellow-400/30",
];
```
Tags get assigned a color based on their string hash index into this array.

## Files
| Action | File |
|--------|------|
| Edit | `src/pages/TheBar.tsx` — restructure sidebar, add colorful tags, browse/topics sections, answer count + author in cards |

