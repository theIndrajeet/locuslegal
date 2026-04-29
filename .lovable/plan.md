# Updates Broadcast System

Admin-only tool to send monthly updates and feature announcements from `noreply@locus.legal` to all registered Locus users. Uses Lovable's built-in queue (no third-party service).

## What gets built

### 1. Database (one migration)
- `update_broadcasts` table — stores broadcast history
  - `id`, `subject`, `body_markdown`, `cta_label`, `cta_url`, `sent_by`, `recipient_count`, `sent_at`, `status` ('draft' | 'sending' | 'sent' | 'failed')
  - RLS: admin-only SELECT/INSERT/UPDATE
- Reuses existing `suppressed_emails` and `email_unsubscribe_tokens` from email infra

### 2. Edge Functions (3 new)
- **`send-transactional-email`** — generic sender (scaffolded by Lovable's transactional tool, used for both broadcasts and any future app emails)
- **`dispatch-updates-broadcast`** — admin-only. Verifies caller is admin, fetches all users via `auth.admin.listUsers()`, filters out suppressed addresses, loops and enqueues one `send-transactional-email` call per recipient. Updates broadcast row to `sent` with final count.
- **`handle-email-unsubscribe`** — validates unsubscribe tokens (scaffolded)

### 3. Email template
- `_shared/transactional-email-templates/updates-broadcast.tsx`
  - Neobrutalist styling (white body, black borders, yellow accent CTA, Sora/Inter fonts)
  - Props: `subject`, `bodyMarkdown` (rendered to HTML), `ctaLabel?`, `ctaUrl?`
  - System auto-appends unsubscribe footer

### 4. Admin UI — `/admin/updates`
- Gated by `useAdminRole` (same pattern as `AdminBar.tsx`)
- **Compose form**: subject, markdown body (textarea), optional CTA label + URL
- **Live preview pane** rendering the email
- **"Send test to me"** button — sends only to the admin's own email
- **"Send to all users"** button — shows confirm dialog with recipient count, then triggers dispatcher
- **History table** below — past broadcasts with sent date, recipient count, subject

### 5. Public unsubscribe page — `/email-unsubscribe`
- Reads `?token=` from URL, validates via edge function, shows confirm button, marks email as suppressed on click

### 6. Navigation
- Add "Updates" tab to admin nav (alongside existing admin pages)

## How it works (flow)

```text
Admin types update → clicks "Send to all"
  ↓
dispatch-updates-broadcast (admin check)
  ↓
listUsers() → filter suppressed → for each user:
  ↓
enqueue → auth_emails has priority, transactional drains after
  ↓
process-email-queue (cron, every 5s) → sends via Lovable Email API
  ↓
Each email has unsubscribe footer auto-appended
  ↓
Status logged in email_send_log + broadcast row updated
```

## Safety guarantees
- Auth emails (password reset, signup) stay in higher-priority lane — broadcasts never block them
- Suppressed emails skipped automatically
- 5-attempt retry + dead-letter queue per recipient
- Idempotency keys prevent double-sends on retry
- Admin-only RLS + edge function admin verification (defense in depth)

## Out of scope (can add later if needed)
- Audience segmentation (only sending to firms vs students)
- Scheduled sends
- A/B subject lines
- Open/click tracking

---

Approve and I'll build it.