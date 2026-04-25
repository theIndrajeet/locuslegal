## Why your site feels slow & "cached"

After auditing the code, here's what's actually hurting you:

### 1. Every page ships the entire app (~8,000 lines of pages) on first load
`src/App.tsx` does a static `import` of **all 25 pages** (Tools alone is 1,056 lines, CvAnalyser 992, TheBarPreview 795). Visiting `/` downloads code for `/admin/bar`, `/the-bar/challenge`, `/cv-analyser`, etc. On mobile/slow networks this is the biggest single cause of "loads slowly, then doesn't load."
**Fix:** Convert all routes except `Index` and `Layout` to `React.lazy()` with a `<Suspense>` fallback. Expected JS reduction: **60–75%** on first paint.

### 2. `index.html` tells browsers *not to cache the HTML* — but Vite's hashed JS/CSS *should* be cached forever
Line 11: `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">` is fine for the HTML shell, but combined with the version-check hook it causes Safari/iOS to re-fetch *everything* aggressively, then sometimes serve a half-stale mix.
**Fix:** Keep `no-cache` only on the HTML, but rely on Vite's content-hashed asset filenames (already enabled) for long-term caching of JS/CSS. Also remove the `<meta http-equiv>` and let the CDN handle it via the `<link rel="canonical">` + version.json flow that already exists.

### 3. `useVersionCheck` clears ALL CacheStorage and unregisters service workers on **every mount**
Lines 46–67 of `src/hooks/useVersionCheck.ts` run `caches.delete()` for every cache key on every page load in production. That's the actual "cache thrash" you feel — the browser keeps having its cache wiped, then refilling it. Should be a **one-shot** guarded by `localStorage`.
**Fix:** Run the cleanup once ever (gate with `localStorage.getItem('locus_sw_cleaned_v1')`), then never again.

### 4. `useFeatureVotes` runs on every page that imports it, even when there are no vote buttons visible
`Resources.tsx` and `Tools.tsx` both call it on mount, firing 2 Supabase queries each. The `inFlight` guards we added help, but the hook still re-runs `fetchUserVotes` whenever `userId` changes (which happens on every auth state change including token refresh every ~50 min).
**Fix:** Memoize results in a module-level cache with a 60s TTL so navigation between Tools ↔ Resources doesn't re-query.

### 5. `usePageMeta` mutates `document.head` on every render of every page
Minor, but the `useEffect` deps include `title, description, path, ogImage` — fine — except some pages pass inline objects, causing repeated DOM writes.
**Fix:** No code change needed if pages pass primitives; verify and document.

### 6. Heavy pages have no code-splitting inside themselves
`Tools.tsx` (1,056 lines) renders all 11 tool forms in one component tree. Even hidden ones get parsed.
**Fix:** Split tool form panels into separately-imported chunks loaded on dialog open. (Optional — do only if #1 isn't enough.)

---

## Proposed implementation (one pass)

| # | File | Change |
|---|------|--------|
| 1 | `src/App.tsx` | Wrap all non-critical routes in `React.lazy()` + add `<Suspense fallback={<MinimalLoader/>}>` around `<Routes>` |
| 2 | `src/hooks/useVersionCheck.ts` | Guard SW/cache cleanup with `localStorage` one-shot flag; remove the per-mount `caches.delete()` storm |
| 3 | `index.html` | Remove `<meta http-equiv="Cache-Control">` (let Vite + CDN handle hashed assets correctly) |
| 4 | `src/hooks/useFeatureVotes.ts` | Add module-level 60s TTL cache for `voteCounts` and `userVotes` so cross-page nav doesn't re-fetch |
| 5 | `src/components/Layout.tsx` | Verify the `onAuthStateChange` profile-fetch only runs on `SIGNED_IN`, not `TOKEN_REFRESHED` (already correct, will confirm) |

### What you should see after
- **First page load:** ~60–75% smaller JS bundle, faster Time-to-Interactive
- **Navigation between pages:** no more re-fetching of vote counts on every route change
- **No more "cache thrash":** browser cache is preserved, only invalidated on a real version bump
- **CV upload won't hang:** the underlying cause was main-thread starvation from the cache/network storm; fixing #1, #2, #4 frees the thread

### What I will NOT touch
- Supabase schema, RLS, edge functions
- Visual design, layout, copy
- The version-check toast UX (still works the same — just stops nuking caches every load)

Approve and I'll ship all 5 in one commit.