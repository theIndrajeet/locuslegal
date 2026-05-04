
# Plan: First-party Analytics + Admin Insights Dashboard

You currently have **Meta Pixel** firing `PageView` (which is opaque — you can't query it from your own admin), but **no first-party analytics** of your own. Let's fix that. Build a lightweight, privacy-respecting event pipeline owned by Locus, and surface it as a real dashboard at `/admin/insights`.

## Why first-party (not Plausible/PostHog)

- Zero monthly cost, no third-party data sharing
- All data stays in your Lovable Cloud DB → fully queryable, joinable to `profiles`, `applications`, `bar_attempts`
- Works great alongside Meta Pixel (Pixel for ads attribution, ours for product insight)
- Simple enough that we can ship it in one round

## Architecture

```
[Browser] ──track(event, props)──▶ [edge fn: track-event]
                                          │
                                          ▼
                                   public.analytics_events
                                          │
                                          ▼
                          [edge fn: analytics-summary] ──▶ /admin/insights
```

**No PII:** we hash IPs and store a rotating `anon_id` cookie. Logged-in users we tag with `user_id` (already RLS-safe).

## Events to track (the brainstorm)

Bucketed by intent so the dashboard tells a story, not a wall of numbers.

### Acquisition (where users come from + first impression)
- `page_view` — every route change. Captures `path`, `referrer`, `utm_source/medium/campaign`, `device` (mobile/tablet/desktop), `viewport`
- `external_referrer_landing` — first session hit with a non-locus referrer (so we can rank traffic sources)

### Activation (the install funnel — your direct ask)
- `install_prompt_shown` — pill appears (Android `beforeinstallprompt` fired, OR iOS hint surfaced)
- `install_prompt_clicked` — user taps the pill
- `install_prompt_dismissed` — user clicks the X
- `install_outcome_accepted` — Chrome `userChoice.outcome === 'accepted'`
- `install_outcome_dismissed` — Chrome `userChoice.outcome === 'dismissed'`
- `app_installed` — `appinstalled` event fired
- `pwa_session_start` — load happens with `display-mode: standalone` (= installed user opened the app)

### Conversion (the funnels you actually care about)
- `waitlist_view` / `waitlist_submit` (split by audience: student/firm/university)
- `signup_started` / `signup_completed` (split by method: email/google/apple)
- `vacancy_view` / `vacancy_apply_clicked` / `application_logged`
- `firm_view` / `firm_compare_added` / `firm_compare_opened`
- `playbook_guide_open` / `playbook_guide_completed`
- `bar_challenge_start` / `bar_challenge_submit` / `bar_challenge_perfect_score`
- `cv_analyser_run` / `cover_letter_generated`
- `search_opened` (Cmd+K) / `search_query` / `search_result_clicked`

### Engagement (sticky vs leaky)
- `feature_voted` / `feedback_submitted`
- `share_clicked` (which surface)
- `email_unsubscribe` (which stream)
- `download_resource` (LX-001 through LX-005)

## Database

### `public.analytics_events`
| column | type | notes |
|---|---|---|
| id | uuid (pk, default gen_random_uuid()) | |
| created_at | timestamptz default now() | indexed |
| event | text not null | indexed |
| user_id | uuid null | nullable, FK-by-convention to auth.users |
| anon_id | text null | rotating client cookie |
| session_id | text null | per-tab session |
| path | text | |
| referrer | text | |
| device | text | 'mobile'/'tablet'/'desktop' |
| utm | jsonb | `{source,medium,campaign,term,content}` |
| props | jsonb | event-specific payload |
| ip_hash | text | sha256(ip + daily-rotating-salt) — never store raw IP |
| country | text | from CF/Edge headers if available |

Indexes: `(event, created_at desc)`, `(created_at desc)`, `(user_id, created_at desc)`.

### RLS
- `INSERT`: anyone (service role anyway via edge fn — no client direct insert)
- `SELECT`: only admins (`has_role(auth.uid(), 'admin')` or any specific scope)
- No update, no delete from clients

### Retention
Cron `purge_old_analytics_events` daily — hard-delete rows older than 180 days (configurable).

## Edge functions

### 1. `track-event` (POST, public, `verify_jwt = false`)
- Validates body with Zod: `event` (string, max 64), `props` (jsonb, max 4KB), `path`, `referrer`
- Reads `user_id` from JWT if Authorization header present (graceful fallback to anon)
- Reads `anon_id` from cookie or body
- Hashes IP with daily rotating salt (in DB function `current_analytics_salt()`)
- Inserts into `analytics_events`
- Returns 204 with no body (fire-and-forget friendly)
- Rate limit: per `anon_id` 60 events/min via in-memory counter (acceptable for a single-region edge fn at our scale)

### 2. `analytics-summary` (GET, admin-only)
- Verifies admin via JWT + `has_role`
- Query params: `range` (`24h|7d|30d|90d`), `event` (filter), `compare` (boolean prev-period)
- Returns `{ totals, timeseries, topPaths, topReferrers, devices, funnels }`
- Heavy lifting via SQL views/functions (below) — keeps the function thin

### 3. SQL views (created in migration)
- `vw_dau` — distinct `coalesce(user_id::text, anon_id)` per day
- `vw_install_funnel` — counts of shown → clicked → accepted, with conversion %
- `vw_signup_funnel` — page_view → signup_started → signup_completed
- `vw_top_paths` — most-viewed paths in window
- `vw_top_referrers` — top external referrer hostnames

## Client tracker

### `src/lib/analytics.ts`
- `track(event, props?)` — POSTs via `navigator.sendBeacon` first (no perf cost), `fetch` fallback
- Auto-attaches: `path`, `referrer`, `device`, `viewport`, `utm`, `anon_id`, `session_id`
- Reads `anon_id` from `localStorage` (rotates yearly)
- `session_id` in `sessionStorage` (per-tab)
- Strips PII: never serialize input values, form fields, or query strings containing tokens
- Honors Do Not Track (`navigator.doNotTrack === '1'` → no-op)

### `src/hooks/useTrackPageViews.ts`
Mounted in `Layout.tsx`. Listens to `useLocation()` and fires `page_view` on route change (debounced 250ms to dodge double-renders). Fires once on mount for the initial load.

### Wire-up points (call sites)
- `src/components/InstallLocusButton.tsx` → `install_prompt_shown` (on visible), `install_prompt_clicked`, `install_prompt_dismissed`, `install_outcome_*`, `app_installed`
- `src/components/WaitlistSection.tsx` → `waitlist_submit`
- `src/pages/Auth.tsx` → `signup_started` / `signup_completed`
- `src/components/vacancies/VacancyCard.tsx` → `vacancy_view` (on visible via IntersectionObserver), `vacancy_apply_clicked`
- `src/components/applications/LogApplicationDialog.tsx` → `application_logged`
- `src/components/FirmDrawer.tsx` → `firm_view`
- `src/components/CompareBar.tsx` → `firm_compare_*`
- `src/pages/PlaybookGuide.tsx` → `playbook_guide_*`
- `src/pages/TheBarChallenge.tsx` → `bar_challenge_*`
- `src/pages/CvAnalyser.tsx` → `cv_analyser_run`
- `src/components/apply/DraftEmailDialog.tsx` → `cover_letter_generated`
- `src/components/search/CommandPalette.tsx` → `search_*`
- `src/pages/Resources.tsx` → `download_resource`
- `src/main.tsx` → check `display-mode: standalone` once → `pwa_session_start`

## The dashboard — `/admin/insights`

A single, scannable page with this hierarchy:

### 1. Hero KPI strip (4 large stat cards)
- **Active users (24h)** — distinct users + Δ vs prev 24h (▲/▼ chip)
- **Page views (24h)** — total + Δ
- **New signups (24h)** — count + breakdown chip (email/google/apple)
- **PWA installs (7d)** — count + Δ (this is your install CTA scoreboard)

### 2. Trends (3 sparklines side-by-side)
- DAU, page views, signups — last 30 days, brushable

### 3. The install funnel (your direct ask) — full-width card
A horizontal funnel:
```
Pill shown ──▶ Clicked ──▶ Accepted ──▶ Installed
   1,240         420         180          165
                 (34%)       (43%)        (92%)
```
Plus device split (Android vs iOS) and a "Standalone sessions (7d)" counter that proves installs are sticky.

### 4. Top funnels grid (4 mini funnels)
- **Waitlist**: visited → submitted (segmented by audience)
- **Signup**: landing → started → completed
- **Application**: vacancy view → apply clicked → logged
- **Bar**: challenge view → started → submitted

### 5. Acquisition table
Top 10 referrer hostnames with sessions + signups attributed (last 30d). Excludes `locus.legal` self-referrals.

### 6. Top pages table
Top 20 paths by views (24h / 7d / 30d toggle). Click a row to see the funnel from that landing page.

### 7. Live tail (collapsible)
Last 50 events as a JSON-style log feed for sanity-checking that tracking actually fires. Auto-refreshes every 5s.

### 8. Range + filter controls (sticky header)
- Range: 24h / 7d / 30d / 90d / custom
- Compare to previous period: on/off
- Filter by event: multi-select chip
- Refresh button

All charts use Recharts (already in shadcn). Tables use existing `<Table>` shadcn component. Aesthetic: same neobrutal stat cards as `AdminDashboard`, hard 4px shadows, Sora headings.

### 9. Tile on `/admin`
Add an "Insights" tile to `AdminDashboard.TILES` (any admin scope can see — gated to `'admin'` for now, easy to broaden later):
```ts
{ to: "/admin/insights", title: "Insights", description: "Live product analytics, funnels, and install metrics.", icon: BarChart3, scope: "admin", fullAdminOnly: true }
```

Also add a small "Live now" mini-card to the existing dashboard hero — so when you open `/admin` you immediately see "27 active users right now" with a click-through to Insights.

## Files

### New
- `supabase/migrations/<ts>_analytics_events.sql` — table + indexes + RLS + views + cron
- `supabase/functions/track-event/index.ts`
- `supabase/functions/analytics-summary/index.ts`
- `src/lib/analytics.ts`
- `src/hooks/useTrackPageViews.ts`
- `src/pages/AdminInsights.tsx`
- `src/components/admin/insights/KpiStrip.tsx`
- `src/components/admin/insights/TrendChart.tsx`
- `src/components/admin/insights/Funnel.tsx`
- `src/components/admin/insights/TopTable.tsx`
- `src/components/admin/insights/EventTail.tsx`
- `src/components/admin/insights/RangeSelector.tsx`

### Modified
- `src/App.tsx` — register `/admin/insights` route
- `src/pages/AdminDashboard.tsx` — add Insights tile + "Live now" mini-card
- `src/components/Layout.tsx` — mount `useTrackPageViews()`
- `src/components/InstallLocusButton.tsx` — fire install events
- `src/components/WaitlistSection.tsx`, `Auth.tsx`, `VacancyCard.tsx`, `LogApplicationDialog.tsx`, `FirmDrawer.tsx`, `CompareBar.tsx`, `PlaybookGuide.tsx`, `TheBarChallenge.tsx`, `CvAnalyser.tsx`, `DraftEmailDialog.tsx`, `CommandPalette.tsx`, `Resources.tsx` — sprinkle `track()` calls (one-liners, never block UI)
- `src/main.tsx` — fire `pwa_session_start` when standalone

### Memory
- New `mem://features/analytics-pipeline` — table schema, event taxonomy, no-PII rule, dashboard route, tracker file path
- New `mem://features/admin-insights` — dashboard structure + key metric definitions
- Append note to `mem://features/installable-pwa` — install funnel events list

## Out of scope

- Plausible/PostHog/GA4 integration — first-party only for now
- A/B testing infra — events are recorded but no experimentation framework
- Cohort retention analysis — possible later from the same table; this v1 focuses on funnels + acquisition
- Session replay (intentionally avoided — too heavy + privacy-loud)
- Email open/click tracking integration — separate pipeline (lives in `email_send_log`); we'll cross-reference but not merge in v1
- Alerts / Slack pings on metric drops — easy to add later via cron

## Phasing (recommended)

If you'd rather not do this all in one go:

- **Phase A (this turn if you approve):** DB + `track-event` fn + client tracker + page views + install events + a v1 dashboard with KPI strip, install funnel, top pages, and live tail. ≈90% of the value.
- **Phase B (later):** Wire up the remaining ~10 call sites, add other funnels, add referrer attribution, add compare-to-previous-period.

Tell me **"go phase A"** for the ship-it path, or **"go all in"** to do both phases now.

## Verification

- Open `/admin/insights` as admin → KPIs populate, trend lines render, install funnel shows numbers
- Visit any page in another tab → live tail shows the `page_view` within 5s
- Tap the Install pill on Android → `install_prompt_clicked` appears, then `install_outcome_*`
- Dismiss the pill → `install_prompt_dismissed` fires
- Sign up a new test account → signup funnel ticks up
- Non-admin loads `/admin/insights` → blocked by `AdminLayout` → redirected
- Lighthouse mobile: tracker adds <2KB gzipped, fires beacons that don't block paint
