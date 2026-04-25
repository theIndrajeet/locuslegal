# Batch A — Foundation perf wins

Four small, safe, high-ROI changes. No new dependencies, no UI changes the user will see (except things feeling faster and stiller).

---

## 1. React Query global defaults (`src/App.tsx`)

Currently:
```ts
const queryClient = new QueryClient();
```

Change to:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: 1,
    },
  },
});
```

**Risk audit** — searched the codebase for queries that genuinely need fresh-on-mount data. The ones to watch:
- Bar leaderboard / recent attempts → already invalidated after `submit-bar-attempt`, safe.
- `useFeatureVotes` → uses its own module cache + optimistic UI, not React Query, unaffected.
- Applications list → mutations already call refetch, safe.

If any specific query later needs tighter freshness, override `staleTime` per-query rather than fighting the global.

---

## 2. Animation guards

**Already guarded** (verified): `gooey-text-morphing` (document.hidden), `shape-landing-bg`, `falling-pattern`, `timeline-animation` (all use `useReducedMotion`).

**Needs fixing — `src/components/ui/background-paths.tsx`:**
- Currently runs 72 infinite Framer Motion path animations regardless of reduced-motion preference or tab visibility.
- Add `useReducedMotion()` → if true, render the SVG static (no `animate` prop, no `transition`).
- Wrap the component output so it pauses repaints when `document.hidden` (visibilitychange listener gating a state flag that conditionally renders the motion paths vs static paths).

Mechanical, ~15 lines.

---

## 3. Consolidate auth hooks onto `useAuthSession`

Three hooks currently each call `supabase.auth.getSession()` on mount, defeating the module-cache work we just did:

- **`src/hooks/useAdminRole.ts`** — replace internal `getSession()` + `onAuthStateChange` with `const { userId, ready } = useAuthSession()`. Run the `user_roles` lookup in a `useEffect` keyed on `userId`. Return `null` while `!ready`, `false` if no user, the role check otherwise.
- **`src/hooks/useFeatureVotes.ts`** (line 93) — same pattern. Replace the `getSession().then(...)` block with `useAuthSession()` and key the votes fetch on `userId`.
- **`src/hooks/usePlaybookProgress.ts`** (line 20) — same pattern. Drop the local `userId` state and the `onAuthStateChange` subscription entirely; consume `useAuthSession()` directly.

Net effect: one auth handshake per browser tab instead of N (where N = number of hooks × number of pages mounted). Eliminates a class of redundant calls we hadn't measured.

---

## 4. Font loading trim (`index.html`)

Current Google Fonts URL loads:
- Sora 400/500/600/700/800 (5 weights)
- Inter 400/500/600/700 (4 weights)
- Cormorant Garamond 400/500/600/700 + italics (8 variants)
- DM Mono 300/400/500
- DM Sans 300/400/500
- Instrument Serif regular + italic
- JetBrains Mono 400/500/600

That's ~25 font files. `font-display: swap` is already set (✓).

**Action**: audit which weights are actually used in `tailwind.config.ts` font weight classes and `src/index.css`. Trim to the ones that ship — likely:
- Sora 600/700 (headings only ever bold)
- Inter 400/500/600 (body, medium emphasis, buttons)
- Keep Cormorant / Instrument Serif / mono fonts only if they're actively referenced; otherwise drop them entirely.

I'll grep for actual usage before cutting and report exactly what gets removed in the implementation message. Conservative — no font that's referenced anywhere in the codebase will be removed without flagging it.

Also add `<link rel="preload" as="font" crossorigin>` for the 1-2 weights used above the fold (Sora 700 for the hero, Inter 400 for body).

---

## Out of scope (deferred to Batch B)

- SECURITY DEFINER RPCs to bundle multi-query pages (`/u/:username`, `/the-bar`, `/applications`)
- `vite build` bundle analysis
- Image optimization, hover-data-prefetch (deferred per Claude's ordering)

---

## Verification after implementation

1. Build succeeds (`bun run build`).
2. Manually click through `/`, `/the-bar`, `/the-bar/browse`, `/playbook`, `/applications` — confirm no skeleton stalls and no console errors from the auth-hook refactor.
3. DevTools → Network → filter `fonts.gstatic.com` → confirm reduced font requests.
4. DevTools → Performance → record a tab-switch — confirm `background-paths` is no longer the top CPU consumer.

Approve and I'll ship all four in one pass.