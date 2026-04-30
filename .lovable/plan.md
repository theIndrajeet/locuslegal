## Problem

The "Locus is open. Start your journey." draft I inserted lives in the database, but the Recent broadcasts list only shows a Delete button. There's no way to:
- Load a saved draft back into the composer to inspect/edit it
- Send a test of an existing draft
- Send an existing draft to all users

Right now `handleTestSend` and `handleSendAll` always call `createDraft()` which inserts a **new** row from the form fields — they never reuse an existing draft. So the row I created via SQL is unreachable from the UI.

## Fix

Update `src/pages/AdminUpdates.tsx` so each draft row in Recent broadcasts gets three actions, plus a small refactor so test/send can target an existing draft id.

### 1. Refactor send helpers to accept an existing draft id

- Extract a `sendBroadcast(id, testEmail?)` helper that just invokes `dispatch-updates-broadcast`.
- Change `handleTestSend` / `handleSendAll` to: if a draft id is passed in, reuse it; otherwise create one from the composer fields (current behavior preserved).

### 2. Add row actions in Recent broadcasts

For every row with `status === "draft"`, show four icon buttons (right-aligned, same row as the existing trash):

- **Load into composer** (Pencil icon) — populate subject / preheader / body / cta fields from the row, scroll to top. Lets you edit and re-send (a fresh draft row is created on send, current row stays as-is).
- **Send test to me** (TestTube2 icon) — calls `sendBroadcast(row.id, myEmail)`. No new draft created.
- **Send to all users** (Send icon) — wrapped in the same AlertDialog confirmation, calls `sendBroadcast(row.id)`. No new draft created.
- **Delete** (Trash2 icon) — unchanged.

For non-draft rows (`sending` / `sent` / `failed`), only show **Load into composer** (useful for duplicating past sends) and **Delete**.

### 3. Small UX touches

- Disable the row's test/send buttons while `busy` is true.
- After sending an existing draft to all, refresh history so its status flips from `draft` → `sent`.
- Use compact `size="sm" variant="ghost"` icon buttons with `title=` tooltips so the row stays clean on mobile.

## Result

Once approved, you'll be able to open `/admin/updates`, find the **"Locus is open. Start your journey."** draft in Recent broadcasts, click **Send test to me** on that exact row, verify it in your inbox, then click **Send to all users** on the same row to dispatch to all 30 recipients — without re-typing anything.

No DB or edge function changes needed; the dispatcher already accepts an existing `broadcastId`.
