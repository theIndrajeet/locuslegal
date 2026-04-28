## One-Tap Apply: AI-Drafted Application Email

Add a "Draft Application Email" action in the Firm and Startup drawers that uses the user's profile/CV to generate a personalised email, opens Gmail with subject + body pre-filled, reminds the user to attach their CV, and auto-logs the application to the tracker.

---

### Flow

```text
Firm/Startup drawer
   └─ "Draft Application Email" button (only if target email exists)
        ▼
   AI Email Composer Dialog
   ├─ Target context: name, type, city, sector, practice areas (from existing data)
   ├─ Your context: name, college, degree, year, bio, top 3 internships, subjects
   ├─ Banner if no CV: "Add your CV for a stronger, more personalised email" → link to /profile/edit
   ├─ Tone selector: Formal / Warm / Concise (default Formal)
   ├─ Role field: defaults "Legal Internship" — user editable
   ├─ Optional 1-line "anything to add" input (e.g. "available May–July")
   ├─ [Generate] → calls draft-application-email edge function (non-streaming)
   ├─ Shows editable Subject + Body, character count, [Regenerate] [Copy]
   └─ [Open in Gmail] (primary)
        ├─ Opens mailto: with to/subject/body pre-filled
        ├─ Toast: "Don't forget to attach your CV before sending"
        └─ Auto-inserts row in profile_applications (status=sent, method=email, notes=body excerpt)
```

---

### What changes

1. **New edge function `draft-application-email`**
   - Inputs: `target` (name, type, sector/practice, city), `role`, `tone`, `extra_note`, `user` (display_name, college, degree, graduation_year, bio, subjects_of_interest, top 3 internships)
   - Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a structured tool-call returning `{ subject, body }`
   - System prompt enforces: Indian legal context, professional tone, mentions one specific reason the user is interested in this firm/company (uses sector/practice), references 1-2 most relevant internships if any, ends with availability + CV attached note, no emojis, no placeholders like `[Your Name]`
   - Returns 429/402 errors cleanly to the client

2. **New component `src/components/apply/DraftEmailDialog.tsx`**
   - Loads profile + internships + bar/cv flag via single Supabase round-trip on open
   - Banner if `cv_url` is null linking to `/profile/edit`
   - Tone tabs, role input, extra-note input, Generate button
   - Editable subject + body textareas after generation
   - Copy button (clipboard) + "Open in Gmail" button (uses `mailto:` — works on mobile Gmail app and desktop)
   - On send: inserts into `profile_applications` and shows success toast

3. **Wire the button into both drawers**
   - `src/components/FirmDrawer.tsx`: add "Draft Application Email" button (primary action) above "Open in Google Maps" when `firm.email` exists. Pass firm context.
   - `src/components/StartupDrawer.tsx`: add same button when `startup.email` exists, above "Log as Application". Pass startup context (sector, stage, legal needs become "practice areas").

4. **Auth gate**
   - If user not signed in, button shows but tapping it triggers redirect to `/auth?redirect=<current path>` with toast "Sign in to draft a personalised application email".

5. **Cache (lightweight)**
   - In-component memo: cache the last `{ targetId → { subject, body } }` in component state so re-opening the same firm in a session doesn't re-bill. No DB persistence — keeps it cheap and avoids stale drafts after profile updates.

---

### Technical notes

- **Mailto limits**: most clients (Gmail web, iOS Mail, Android Gmail) accept ~2000 char `body` reliably. We'll cap body at ~1800 chars and URL-encode properly. If over, we still copy full body to clipboard and toast "Body copied — paste into Gmail if truncated".
- **Gmail compose deep link** (better on desktop): we'll try `https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...` with a fallback to plain `mailto:` for mobile. Detect via `navigator.userAgent` quick check; on mobile use `mailto:` (opens native Gmail app).
- **Auto-log**: insert `{ user_id, firm_name_snapshot: target.name, role, applied_on: today, method: 'email', status: 'sent', notes: 'Drafted via Locus AI — ' + body.slice(0, 500) }`. Failure to log shouldn't block the email open — show non-blocking toast.
- **Profile data fetch**: one query to `profiles` + `profile_internships` (limit 3, order by start_date desc). No need to read CV file itself — the parsed profile fields already represent it.
- **No streaming** — use `supabase.functions.invoke` with structured tool output for `{subject, body}`.

---

### Out of scope (explicitly)

- Uploading the CV directly into Gmail (browsers can't do this — user must attach manually; we just remind them).
- Persisting drafts to DB.
- Multi-language support.
- Bulk apply.