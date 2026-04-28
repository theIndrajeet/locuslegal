# Fix "Open in Gmail" handoff

## Root cause

In `DraftEmailDialog.tsx`, the `openInGmail` handler is `async` and **awaits `navigator.clipboard.writeText` before calling `window.open`**. By the time the open call runs, the browser no longer treats it as a user gesture — so on mobile it gets blocked or silently no-ops, and only the auto-log (which runs after) actually completes. That's exactly what you saw: app got logged, Gmail never opened.

Publishing won't fix it — same code, same behavior.

## Changes

Single file: `src/components/apply/DraftEmailDialog.tsx` — rewrite `openInGmail`:

1. **Make it synchronous** (drop `async`). Build the URL and trigger the open **first**, before anything else.
2. **Mobile** (`/Mobi|Android|iPhone|iPad/i`) → use `window.location.href = mailto:...` so iOS/Android route to the user's default mail app (Gmail if installed). `window.open` for `mailto:` is unreliable on iOS Safari.
3. **Desktop** → keep `window.open(gmailWebUrl, '_blank')` as today.
4. **Clipboard backup** → fire-and-forget (`void navigator.clipboard.writeText(...).catch(...)`), no await.
5. **Auto-log to `profile_applications`** → fire-and-forget with `.then()` for the toast, never awaited before the open call.
6. Toasts ("attach your CV", "logged to tracker") stay; order is now: open mail → show reminder → log in background.

## Result

- Mobile: tapping "Open in Gmail" launches the Gmail app (or default mail app) with subject + body pre-filled.
- Desktop: same as before — Gmail web compose opens in a new tab.
- Auto-log still happens, just doesn't block the handoff.
- Reminder to attach CV manually remains.
