## Goal

Fix `/admin/broadcasts` so real broadcasts actually reach users, give the admin a safe "send test to me" path, and let them eyeball the rendered email before pressing Send.

## 1. Fix the "0 recipients" bug in `send-broadcast`

Root cause: `supabase.auth.admin.listUsers({ perPage: 1000 })` is paginated and the destructure `{ data: { users } = { users: [] } }` is fragile — when the response shape isn't perfect, `users` is undefined and the email map ends up empty, so every recipient is silently skipped.

Rewrite the recipient resolution in `supabase/functions/send-broadcast/index.ts`:

- Page through `auth.admin.listUsers({ page, perPage: 1000 })` in a loop until fewer than `perPage` users come back. Build a single `Map<userId, email>` across all pages.
- Defensive read: `const res = await supabase.auth.admin.listUsers(...); const users = res.data?.users ?? [];` — never destructure blindly.
- Filter out emails ending in `@locus.internal` (Pace-Setter accounts) and empty/null emails — preserves existing behaviour.
- After building the map, if `userIds.length > 0` but `emailMap.size === 0`, return a `500` with `{ error: 'recipient_lookup_failed' }` so the UI surfaces the failure instead of silently logging "queued: 0".
- Track and return `skippedNoEmail` count alongside `queued` so the UI can show "Queued 142, skipped 6 (no email)".
- Only insert the `update_broadcasts` history row when `queued > 0` — avoids polluting history with failed 0-send attempts. (Failures still return an error to the client.)

## 2. Add "Send test to me" button

In `src/pages/AdminBroadcasts.tsx`, next to the existing "Send broadcast" button, add a secondary outlined "Send test to me" button.

Behaviour:
- Disabled unless subject + body are filled.
- Calls `send-broadcast` with a new flag `testOnly: true`.
- Edge function, when `testOnly === true`:
  - Ignores `segment` entirely.
  - Resolves the caller's own email from the JWT (`user.email`).
  - Sends exactly one transactional email with idempotency key `broadcast-test-${crypto.randomUUID()}` so repeated tests aren't deduped.
  - Does NOT insert into `update_broadcasts`.
  - Returns `{ ok: true, test: true, sentTo: <email> }`.
- Toast shows "Test sent to you@example.com — check your inbox".

## 3. Live preview pane

Split the form section into a two-column layout on `md+` screens:
- Left: existing inputs (subject, body, CTA, segment).
- Right: a sticky preview card styled like the real transactional email (white card, subject as `<h1>`, rendered body HTML via the same tiny markdown converter ported to the client, then a yellow neobrutalist CTA button if label+url present, then a muted footer line "Locus by LexRoot · Unsubscribe").

The preview updates live as the admin types. On mobile (`<md`), preview collapses below the form behind a "Preview" disclosure to keep the editor usable.

Port the `mdToHtml` helper from the edge function into a small shared util at `src/lib/email-markdown.ts` so client preview and server render stay in sync.

## Technical notes

- Files touched:
  - `supabase/functions/send-broadcast/index.ts` — paginated `listUsers`, `testOnly` branch, defensive logging.
  - `src/pages/AdminBroadcasts.tsx` — test button, preview pane, two-column layout.
  - `src/lib/email-markdown.ts` (new) — shared md→html.
- Edge function will be redeployed automatically.
- No DB migrations needed.

## Verification

1. From `/admin/broadcasts`, click "Send test to me" with the v2 launch draft → admin inbox receives one branded email; no row appears in Recent broadcasts.
2. Click "Send broadcast" with segment "All users" → toast shows non-zero queued count; row appears in history with matching `recipient_count`; spot-check a real user inbox.
3. If `auth.admin.listUsers` ever fails, the UI now shows "recipient_lookup_failed" instead of silently logging "queued: 0".
