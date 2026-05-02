## Soft-remove non-Google sign-in

Make Google the only visible sign-in method on `/auth`, while keeping email/password and Apple **enabled in the backend** as an invisible safety net so existing 6 non-Google users (incl. admin fallback) aren't locked out.

### Changes — `src/pages/Auth.tsx`

1. **Hide the Apple button** entirely.
2. **Hide the email/password form, username field, "Forgot password" link, and the "Sign up / Sign in" toggle** from the default view.
3. Keep "Continue with Google" as the single primary CTA, with copy: *"Continue with Google to access your account."*
4. Add a hidden escape hatch: if the URL contains `?legacy=1` (e.g. `/auth?legacy=1`), the old email/password form re-appears under a small "Legacy sign-in" divider. This gives the 3 affected Gmail users a recovery path if they ever ask, without exposing it publicly.
5. All existing handlers (`handleSubmit`, `handleForgotPassword`, `/reset-password` route) stay intact — just no UI surface unless `?legacy=1` is set.

### Backend
- **No Cloud auth provider changes.** Email/password and Apple stay enabled at the provider level. This guarantees zero lockouts for the 6 existing non-Google accounts and zero migration risk.
- **No DB changes.**

### Net effect
- **New users:** see one button only → Google.
- **Existing Google users (12):** zero change.
- **Existing email/Apple/phone users (6):** sessions keep working; if they need to re-login, send them `/auth?legacy=1` (or the Gmail-based ones can just hit "Continue with Google" with the same email and Supabase will match by verified email).

### Out of scope
Removing accounts, disabling auth providers, deleting the `/reset-password` page, or migrating existing users — all reversible later if you want a hard cut.