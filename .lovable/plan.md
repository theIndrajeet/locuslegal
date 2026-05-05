## Two changes

### 1) Add "Download Locus" to the profile side menu

In `src/components/ProfileMenu.tsx`, add a new menu item between "Replay product tour" and the Admin/Sign-Out section:

- Label: **Download Locus** (with `Download` icon from lucide-react)
- Hidden when the app is already running installed (display-mode: standalone) — no point showing it then
- Behavior:
  - **Android/Chromium**: if a `beforeinstallprompt` event has been captured, fire the native install prompt
  - **iOS Safari**: open a small instructions dialog (Tap Share → Add to Home Screen) — same copy that the floating pill uses
  - **Desktop / unsupported**: show a toast "Open Locus on your phone to install the app"

To make this work without duplicating logic, extract the install logic from `InstallLocusButton.tsx` into a small shared hook `src/hooks/useInstallLocus.ts` that exposes:
- `canInstall: boolean` (Android prompt captured OR iOS Safari)
- `isInstalled: boolean`
- `platform: "android" | "ios" | "other"`
- `triggerInstall()` — fires native prompt or opens the iOS instructions modal

`InstallLocusButton` is refactored to use the hook (no UX change to the floating pill). `ProfileMenu` uses the hook + a tiny iOS instructions `Dialog` reused from the existing pill copy.

### 2) "Keep me logged in until I sign out" — root cause + fix

**Diagnosis (not a bug in our auth config):** The Supabase client at `src/integrations/supabase/client.ts` already uses `localStorage`, `persistSession: true`, and `autoRefreshToken: true`. Sessions are kept indefinitely as long as the refresh token is used at least once every 30 days.

Looking at the auth logs, yesterday's Google login was on `locuslegal.lovable.app` and today's "re-login" was also via Google on `locuslegal.lovable.app` — but the page that triggered it had referer `locus.legal/`. **Different origins do not share localStorage**, so a session on `locus.legal` is invisible to `locuslegal.lovable.app` and vice-versa. That's why it felt like a forced re-login.

**Fix — make `locus.legal` the single canonical origin so the session sticks:**

1. **Redirect `locuslegal.lovable.app` → `locus.legal`** at runtime, in `src/App.tsx` (top-level effect):
   - If `window.location.hostname === "locuslegal.lovable.app"`, replace to `https://locus.legal` + same path/search/hash.
   - Skip the redirect on the Lovable preview host (`id-preview--…lovable.app`) and on `localhost` so editing/preview keeps working.
2. **Pin OAuth redirect to current origin** for Google sign-in calls in `src/pages/Auth.tsx` (and any other place we call `signInWithOAuth`) by passing `redirectTo: window.location.origin + "/"`. Combined with #1 this guarantees the post-OAuth landing is always on `locus.legal`, where the session is stored.
3. **Defensive: token auto-refresh on tab focus.** Add a small effect (in `src/components/Layout.tsx` or `App.tsx`) that calls `supabase.auth.refreshSession()` once when the tab becomes visible after >12h, so a user opening Locus after a long gap silently refreshes instead of appearing signed-out for a flicker.

No database / RLS / edge function changes. No changes to the existing `client.ts` (it's already correctly configured and is auto-generated).

### Files touched
- `src/hooks/useInstallLocus.ts` *(new)*
- `src/components/InstallLocusButton.tsx` *(refactor to use hook, no UX change)*
- `src/components/ProfileMenu.tsx` *(new "Download Locus" item + iOS instructions dialog)*
- `src/App.tsx` *(canonical-host redirect + visibility-based session refresh)*
- `src/pages/Auth.tsx` *(explicit `redirectTo` on Google OAuth)*

### Out of scope
- Centered toast position (already done previously)
- Any changes to firm cards / directory
- Any DB migrations or edge functions
