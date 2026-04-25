## Goal

Figure out **why the site feels slow on mobile** before migrating hosting. If Lovable is genuinely the bottleneck, we migrate. If it's bundle size / queries / render work, Netlify won't help and we fix the root cause instead — saving you the migration overhead (Git deploys, env vars, DNS, two deploy targets to keep in sync).

## Step 1 — Measure the real production site

Run a full performance profile against `https://locus.legal` (not the preview URL) using:

- **`browser--performance_profile`** — Web Vitals, resource timing, long tasks, DOM complexity on mobile-emulated viewport
- **`browser--start_profiling` → reload → `browser--stop_profiling`** — actual JS execution traces, slowest functions, main-thread blocking
- **`browser--list_network_requests`** — see exactly what's loading, sizes, TTFB per asset, and whether Lovable's CDN is the bottleneck
- Compare cold load vs warm load (cache effectiveness)

This tells us conclusively: is the slowness from (a) hosting/CDN, (b) JS bundle execution, (c) Supabase query latency, or (d) third-party scripts.

## Step 2 — Categorise findings

Based on what the profile shows, slowness falls into one of three buckets:

**Bucket A — Hosting/CDN is genuinely slow** (high TTFB on static assets, slow asset delivery from edge)
→ Migrating to Netlify is justified. Proceed with mirror setup (see Step 3a).

**Bucket B — Bundle/render work is the bottleneck** (long JS tasks, large main bundle parse time, expensive re-renders)
→ Netlify won't fix this. Real fixes: split the main 216 KB chunk further, defer non-critical Radix components, audit `useEffect` chains on mobile.

**Bucket C — Supabase query latency** (slow data loads on `/app`, `/the-bar`, etc.)
→ Netlify won't fix this either (same backend). Real fixes: add indexes, reduce N+1 queries, possibly upsize the Lovable Cloud instance via Backend → Advanced settings.

## Step 3 — Act on the diagnosis

**3a. If migrating to Netlify is the right call:**
- Add `public/_redirects` with `/* /index.html 200` (Lovable ignores this file, so it's safe to add now — won't affect current hosting)
- Add `netlify.toml` with sensible cache headers (`Cache-Control: public, max-age=31536000, immutable` on `/assets/*`) — this also fixes the "efficient cache lifetime" SEO audit you've been hitting
- Document env vars needed in Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- You add the Netlify URL to Supabase Redirect URLs allowlist (1-min UI step on your end)
- Mirror first — leave `locus.legal` on Lovable. Compare the two side-by-side before migrating DNS.

**3b. If the bottleneck is bundle/render or queries:**
- Present a targeted optimization plan based on what the profiler actually finds
- No hosting migration needed

## What I'll deliver

A concrete diagnosis (with numbers) of where the mobile slowness actually comes from, and either:
- A safe Netlify mirror setup that lets you A/B compare hosting performance without risk, OR
- A targeted code/query fix list that addresses the real bottleneck.

## What I won't do without confirmation

- Touch DNS or change the Site URL in Supabase auth config
- Remove Lovable hosting until you've verified Netlify is actually faster on the same site
- Make sweeping bundle changes that risk UX regressions
