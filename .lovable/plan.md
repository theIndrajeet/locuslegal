# Rewrite all auth email templates — Locus neobrutalist

Rebuild all 6 templates in `supabase/functions/_shared/email-templates/` from scratch with the Locus brand: Black/White/Yellow palette, Sora headings + Inter body (web-safe fallbacks), hard 3px black borders, hard 6px offset shadows, accented "us" wordmark, zero emojis. Body background stays white (#ffffff) per email rules.

## Brand spec (applied to every template)

```text
Palette
  paper        #FFFFFF   email body bg
  ink          #0A0A0A   text + borders
  body         #2B2B2B   secondary text
  muted        #6B6B6B   meta / footer
  accent       #FFE600   Locus yellow
  surface      #F8F7F2   card inner

Type
  Headings:  Sora, "Sora", Helvetica, Arial, sans-serif (700, -0.02em)
  Body:      Inter, "Inter", Helvetica, Arial, sans-serif (400, 1.6)

Geometry
  Container max-width:  560px
  Card border:          3px solid #0A0A0A
  Card radius:          0 (neobrutalist, no rounding)
  Card shadow (table):  6px 6px 0 #0A0A0A (rendered via wrapper table)
  Button:               yellow fill, 3px black border, 0 radius, hard shadow
```

## Shared layout (every template)

```text
┌──────────────────────────────────────────────┐
│  Loc[us]  ← wordmark, "us" wrapped in        │
│           yellow box w/ black border         │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  EYEBROW LABEL (e.g. VERIFY EMAIL)           │
│  H1 Heading                                  │
│                                              │
│  Body copy in Inter, ink color.              │
│                                              │
│  [  YELLOW CTA BUTTON  ]                     │
│                                              │
│  Or paste this link: <url>                   │
│                                              │
│  ── hr ──                                    │
│  Safety / context line in muted.             │
└──────────────────────────────────────────────┘
   Locus by LexRoot · sent from send.locus.legal
```

The wordmark is an inline HTML span (no image) so it always renders. "us" is wrapped in a yellow box with black border, matching the site's Locus[us] accent rule.

## Per-template content

| Template | Eyebrow | H1 | CTA | Tone |
|---|---|---|---|---|
| signup.tsx | VERIFY EMAIL | Confirm it's you | Verify email | Welcoming, brief |
| magic-link.tsx | ONE-TIME LINK | Your sign-in link | Sign in to Locus | Quick, expiry note |
| recovery.tsx | PASSWORD RESET | Reset your password | Choose new password | Reassuring |
| invite.tsx | INVITATION | You're in. | Accept invite | Direct, exclusive |
| email-change.tsx | EMAIL CHANGE | Confirm new address | Confirm change | Shows OLD → NEW row |
| reauthentication.tsx | VERIFICATION CODE | Confirm it's you | (none — OTP block) | Big yellow OTP card with letter-spacing |

Copy stays concise (≤2 short paragraphs). All include a "paste this link" fallback (except reauthentication which uses an OTP). No emojis. No "Locus by LexRoot" outside the footer line.

## Hook constant fix

`supabase/functions/auth-email-hook/index.ts` currently has stale values from the old `mail.locus.legal` setup:

```text
SITE_NAME      = "locuslegal"              → "Locus"
SENDER_DOMAIN  = "notify.mail.locus.legal" → "send.locus.legal"
ROOT_DOMAIN    = "mail.locus.legal"        → "locus.legal"
FROM_DOMAIN    = "mail.locus.legal"        → "send.locus.legal"
SAMPLE_PROJECT_URL = "https://locuslegal.lovable.app" → "https://locus.legal"
```

Without this, every queued auth email would still try to send through the dead `notify.mail.locus.legal` domain and the From line would say "locuslegal".

## Deploy

After file writes, deploy `auth-email-hook` so the new templates and constants go live. DNS for `send.locus.legal` is already Verified per the screenshot, so emails will start flowing as soon as the hook is redeployed.

## Files touched

- `supabase/functions/_shared/email-templates/signup.tsx` (rewrite)
- `supabase/functions/_shared/email-templates/magic-link.tsx` (rewrite)
- `supabase/functions/_shared/email-templates/recovery.tsx` (rewrite)
- `supabase/functions/_shared/email-templates/invite.tsx` (rewrite)
- `supabase/functions/_shared/email-templates/email-change.tsx` (rewrite)
- `supabase/functions/_shared/email-templates/reauthentication.tsx` (rewrite)
- `supabase/functions/auth-email-hook/index.ts` (constants block only)
- Deploy: `auth-email-hook`

## Out of scope

- No changes to webhook verification, queue logic, or `process-email-queue`.
- No changes to transactional templates.
- No new images / no logo upload (wordmark is inline HTML for guaranteed render).
