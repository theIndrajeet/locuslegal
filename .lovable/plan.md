# Audit findings

I traced the import chain that pulls `supabase-bajmEEQQ.js` (~42 KiB raw, ~14 KiB gzip) into the home page critical bundle. There is exactly **one** remaining offender:

```
src/pages/Index.tsx
  └─ static import: useAuthSession
       └─ static import: @/integrations/supabase/client (supabase chunk)
```

`Index.tsx` calls `useAuthSession()` purely to detect if a logged-in user lands on `/` and redirect them to `/app`. That's a tiny side-effect, but the static import forces the supabase client into the home-page chunk graph for **every visitor**, including anonymous first-time visitors who will never hit that redirect.

**Everything else is already optimized:**
- `Layout.tsx` — already dynamic-imports supabase ✅
- `Navbar.tsx` — uses `ProfileMenuLazy` + `AdminNavLink`, both idle-deferred ✅
- `AdminNavLink.tsx` — already does `import("@/hooks/useAdminRole")` on idle ✅
- `ProfileMenuLazy.tsx` — already `lazy()` + idle-loaded ✅
- `useFeatureVotes.ts` — not imported by any home component (only Tools/Resources, both lazy routes) ✅
- Home components (`RotatingHero`, `FeatureBento`, `AudienceMiniRow`, `FinalCTA`) — zero supabase touch ✅

So this is a single-file fix.

# The fix

## Change `src/pages/Index.tsx` to defer the auth check

Replace the static `useAuthSession` import with an idle-deferred dynamic import using the same pattern that `AdminNavLink.tsx` already uses successfully. The redirect logic moves into a small inner component that mounts only after the page is idle.

**Pattern:**
1. Render the marketing hero + sections immediately, with zero Supabase dependency.
2. After mount, schedule a `requestIdleCallback` (with `setTimeout` fallback) to dynamically import `useAuthSession`.
3. Once loaded, mount a tiny `<AuthRedirectCheck />` child component that runs the hook and triggers `navigate("/app")` if a session exists.

Anonymous visitors (the vast majority of first-time landings) **never download the supabase chunk** for the home page. Returning logged-in users get redirected ~500ms later than they do today — imperceptible, since the home page is purely a marketing landing they're not going to read anyway.

**File touched:** `src/pages/Index.tsx` only.

# Estimated impact

Based on the Lighthouse treemap that previously flagged `supabase-bajmEEQQ.js` at 41.7 KiB unused (82% of the chunk):

| Metric | Before | After (estimated) |
|---|---|---|
| Home critical JS (raw) | ~146 KB | ~104 KB |
| Home critical JS (gzip) | ~45 KB | ~32 KB |
| Lighthouse "unused JS" finding | ~63 KiB | ~20 KiB |
| Mobile Lighthouse score | 66 | **70–75** (realistic) |

**Note on expectations:** the dominant remaining bottleneck is still the **2,090 ms document latency** (server TTFB), which is a Lovable platform issue we can't fix from code. So even with this win, mobile Lighthouse won't hit 90+. The realistic ceiling from inside the codebase is ~75–80.

# Validation steps after the fix

1. Build and check `dist/assets/index-*.js` size (compare gzip before/after).
2. Run `bun run build --mode analyze` and confirm `supabase-*.js` is no longer in the home page's import graph.
3. Smoke-test the `/` → `/app` auto-redirect for a logged-in user (must still work, just ~500ms delayed).
4. Re-run mobile Lighthouse 3× on `https://locuslegal.lovable.app` and report median FCP, LCP, TBT, score.

# Out of scope (per your instructions)

- ❌ Not touching `src/lib/prefetch.ts`
- ❌ Not changing visual design or animations
- ❌ Not regressing desktop (currently 99 — this change is a pure subtraction from the home critical path, can only help)
- ❌ Not asking Lovable for cache headers (separate platform-level conversation)
