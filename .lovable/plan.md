## Root-cause findings from beta CSV + codebase

| # | Issue | Real root cause |
|---|---|---|
| 1 | Signup / password-reset emails not arriving | No email domain or `auth-email-hook` configured. Default Lovable auth emails are sent from a generic sender → testers' Gmail/Outlook treats them as spam or drops them silently. |
| 2 | "Invalid session" / random logouts on profile edit + The Bar | `Layout.tsx` reacts to **every** `SIGNED_IN` event (which also fires on `TOKEN_REFRESHED`) and runs an async profile query → if it returns no row in time, it bounces user to `/choose-username`. Three separate `onAuthStateChange` listeners (Layout, ProfileMenu, useAuthSession) fire concurrent profile fetches. |
| 3 | CV upload crash in profile + CV Analyser | `parse-cv` uses `google/gemini-3-flash-preview` which is preview-tier and rate-limits aggressively → returns 429/500 on real CVs. Frontend `runParse` swallows errors but the `CvSection` upload itself succeeds; the crash testers reported is the analyser page on big PDFs (`bytesToBase64` builds a giant string in memory for 5 MB files). |
| 4 | Mobile dock overlaps CompareBar / hides content | Dock is `fixed bottom-5 z-50`, CompareBar is `fixed bottom-0 z-40`. On directory page on mobile, the dock floats *over* the CompareBar's "Compare" button, blocking clicks. |

---

## Plan

### 1. Set up branded auth emails (fixes signup + password reset delivery)

- Set up an email domain via Lovable Cloud (`notify.locus.legal` subdomain on the existing `locus.legal` domain).
- Scaffold `auth-email-hook` with branded templates (Locus dark theme, yellow accent).
- Deploy the hook so signup confirmation, password reset, and magic-link emails are sent from `notify.locus.legal` instead of the generic Lovable sender → ends up in inbox, not spam.
- Note: setup dialog + DNS verification is needed; emails activate once DNS propagates.

### 2. Fix session race / "invalid session" logouts

- In `Layout.tsx`: change the auth listener to only act on **`SIGNED_IN`** events when `event === "SIGNED_IN"` AND coming from `/auth` or `/choose-username` (filter out `TOKEN_REFRESHED` and `INITIAL_SESSION`). Drop the `profiles` lookup on every event — `handle_new_user` already guarantees a username, so the safety-net query is causing more breakage than it prevents.
- In `ProfileMenu.tsx`: skip the profile re-fetch on `TOKEN_REFRESHED` events too.
- Consolidate to use the shared `useAuthSession` hook in `Layout` and `ProfileMenu` so we have one listener instead of three concurrent ones.

### 3. Fix CV upload + analyser crashes

- In `parse-cv` and `analyse-cv` edge functions: switch model from `google/gemini-3-flash-preview` (preview, low rate-limit) to `google/gemini-2.5-flash` (stable, higher rate-limit, same multimodal PDF support).
- In `CvAnalyser.tsx`: stream PDF bytes to base64 in chunks via `FileReader.readAsDataURL` instead of building the whole string in JS memory — prevents tab freeze on 4-5 MB CVs.
- Improve the error toast in `CvSection.tsx` to surface the actual server message (rate-limit vs. invalid-PDF vs. timeout) instead of the generic "fill manually" fallback so testers know what to retry.
- Add a 60s client-side timeout with retry button (currently if Gemini hangs, the spinner spins forever).

### 4. Fix mobile dock vs CompareBar overlap

- In `MobileBottomDock.tsx`: detect when CompareBar is mounted (via a small zustand-style flag, or simpler: check `document.querySelector("[data-compare-bar]")` on render) and shift the dock up by ~70px, OR hide it entirely on `/directory` when comparing.
- Add `data-compare-bar` attribute on CompareBar's outer div for the dock to detect.
- Ensure z-index ordering is consistent: CompareBar `z-50`, dock `z-40` on `/directory` so CompareBar wins.

---

## Technical details

**Files touched**
- `supabase/functions/auth-email-hook/*` (new, via scaffold tool)
- `supabase/functions/_shared/email-templates/*.tsx` (new, via scaffold tool — then brand-styled)
- `supabase/functions/parse-cv/index.ts` (model swap)
- `supabase/functions/analyse-cv/index.ts` (model swap)
- `src/components/Layout.tsx` (listener cleanup)
- `src/components/ProfileMenu.tsx` (listener cleanup)
- `src/pages/CvAnalyser.tsx` (chunked base64, timeout, better errors)
- `src/components/profile/CvSection.tsx` (better error surfacing)
- `src/components/CompareBar.tsx` (data attribute)
- `src/components/MobileBottomDock.tsx` (dynamic offset/hide)

**Order of execution**
1. Email domain setup (requires user action in dialog — DNS propagates in background while we ship rest)
2. Auth listener fixes (highest user-facing impact, unblocks profile editing)
3. CV upload fixes (model swap is one line; chunked base64 ~10 lines)
4. Mobile dock fix (purely CSS/JS, smallest)

**Out of scope for this fix pass** (revisit after re-test):
- General leaderboard nits, copy issues, and minor UI polish from the CSV — these aren't blockers.
- Building a tester-feedback dashboard — admin already exports CSV.

Approve this plan and I'll start with step 1 (email domain setup dialog) so DNS propagation runs in parallel with the rest of the fixes.
