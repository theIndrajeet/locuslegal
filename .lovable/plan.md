Add the ability to click any past broadcast in the **Recent broadcasts** list and load it back into the composer to edit, change CTA/segment, and either send a fresh test or send a fresh broadcast — like a "duplicate and edit" flow.

## Current state

- `update_broadcasts` already stores everything we need to round-trip: `subject`, `body_markdown`, `cta_label`, `cta_url`, `recipient_count`, `status`, `sent_at`. The history list only shows a one-line summary today; rows are not clickable.
- The composer holds `subject`, `bodyMarkdown`, `ctaLabel`, `ctaUrl`, `segment` in local state. Sending creates a NEW row each time.

## What I'll build

### 1. Make each history row a "Load" action
Each row in **Recent broadcasts** becomes clickable with a clear `Load` button (and the whole row is clickable as a fallback). Clicking it:
- Fetches the full row from `update_broadcasts` (we already have what we need from the list query, plus `body_markdown`, `cta_label`, `cta_url` — extend the select).
- Pre-fills the composer fields: `subject`, `bodyMarkdown`, `ctaLabel`, `ctaUrl`.
- Leaves `segment` as the user's current selection (segment is NOT stored on past broadcasts, so we can't recover it — show a small inline note "Pick a segment below before sending").
- Smoothly scrolls the page to the composer at the top.
- Shows a small banner above the composer: "Editing copy of: \<subject\> sent on \<date\>" with a `Clear` button to wipe back to a blank state.

### 2. Always send as a NEW broadcast
Loading an old broadcast does NOT mutate the original row. Sending always creates a new `update_broadcasts` row with a fresh `id`. This avoids accidental rewriting of history. The "Send test to me" button works the same as today on the loaded copy.

### 3. Subtle UI affordances on history rows
- Hover state (cursor pointer + slight translate using existing neobrutalist hover pattern).
- Add an inline `Load` chip on the right of each row (next to the recipients count) using a Lucide icon (no emojis — use `Pencil` or `Copy`).
- Drafts (rows with `status = 'draft'` and `recipient_count = 0`) get the same load behavior — useful since the user already has several drafts in the list.

### 4. Extend the row select
Update `loadHistory` to also select `body_markdown`, `cta_label`, `cta_url` so the load is instant with no extra round-trip.

## What I'll NOT do (to stay scoped)

- I will NOT add server-side editing of past broadcasts. History stays immutable.
- I will NOT add segment persistence on past broadcasts in this round (the column doesn't exist; adding it is a separate ask).
- I will NOT add a "delete draft" button this turn — separate request if you want it.
- I will NOT touch the edge function — the existing `send-broadcast` already accepts a fresh payload and creates a new row.

## Files

- `src/pages/AdminBroadcasts.tsx` — extend `Broadcast` type + `loadHistory` select, add `loadedFromId` state + banner, add `handleLoad` + `handleClearLoad`, make history rows clickable with a Load chip, scroll-to-composer on load.

No backend or DB changes needed. Approve and I'll ship it.