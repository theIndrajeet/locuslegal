

# "The Bar" — Community Q&A Board with Auth & Database

## Summary

Build a community Q&A page at `/the-bar` with database-backed posts, authentication (login required to post, public reading), and a glitchy nav link. This is a significant feature requiring database tables, auth pages, and the main board UI.

## Database (3 tables + RLS)

### `profiles` table
- `id` (uuid, FK → auth.users, PK)
- `display_name` (text, not null)
- `created_at` (timestamptz)
- Auto-created via trigger on signup

### `bar_questions` table
- `id` (uuid, PK), `user_id` (uuid, FK → profiles), `title`, `body`, `audience` (enum: student/firm/institution), `tags` (text[]), `votes` (int, default 0), `created_at`
- RLS: anyone can SELECT; authenticated users can INSERT (own user_id); authors can UPDATE/DELETE

### `bar_answers` table
- `id`, `question_id` (FK → bar_questions), `user_id` (FK → profiles), `body`, `votes` (int, default 0), `is_top` (bool, default false), `created_at`
- RLS: same pattern as questions

## Auth

### Create `src/pages/Auth.tsx`
- Login / Signup toggle form using Supabase email auth
- Email + password fields, error handling
- Redirect to `/the-bar` after login
- Route at `/auth`

### Create `src/pages/ResetPassword.tsx`
- Password reset form at `/reset-password`

## The Bar Page — `src/pages/TheBar.tsx`

**Layout:** Sidebar (filters) + main feed, matching site's dark neobrutalist theme.

- **Sidebar:** Audience filters (All, Students, Firms, Institutions) + topic tag cloud
- **Main feed:** Search bar, sort tabs (Hot/New/Top), question cards with vote count, tags, answer count
- **Detail view:** Full question, answers list with "Top Answer" badge, answer form (auth-gated)
- **"Ask a Question" button:** Opens modal (auth-gated), posts to database
- **Vote buttons:** Auth-gated, increment/decrement via Supabase

## Navbar Changes — `src/components/Navbar.tsx`

- Add `{ label: "The Bar", href: "/the-bar" }` to navLinks
- Apply CSS glitch animation on "The Bar" link: `::before`/`::after` pseudo-elements with chromatic aberration (red/cyan offsets) and `clip-path` keyframe jitter on hover

## Routing — `src/App.tsx`

- Add routes: `/the-bar`, `/auth`, `/reset-password`
- Auth and reset-password outside Layout wrapper (no navbar needed on those)

## Files

| Action | File |
|--------|------|
| Create | `src/pages/TheBar.tsx` |
| Create | `src/pages/Auth.tsx` |
| Create | `src/pages/ResetPassword.tsx` |
| Edit   | `src/App.tsx` — add 3 routes |
| Edit   | `src/components/Navbar.tsx` — add link + glitch CSS |
| Migration | Create profiles, bar_questions, bar_answers tables with RLS + trigger |

