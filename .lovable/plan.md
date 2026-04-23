

# Rit Audit Report

## TL;DR

**Frontend:** solid. Animations, demo mode, optimistic UI, error handling, RLS-aware history load, message cap, markdown rendering — all in good shape.

**Backend:** the source code in `supabase/functions/rit-chat/index.ts` is correct (uses `auth.getUser`), but **the deployed runtime is still running the old `auth.getClaims` build.** Latest error log is from `14:17:10Z`, after the previous redeploy attempts. Zero successful chats have ever been recorded (`bar_rit_messages` is empty). This is the only blocker — Rit cannot reply in production right now.

**Polish:** a handful of small UX/correctness gaps worth fixing alongside the redeploy.

---

## Findings

### 1. Critical — deployed edge function is stale
- `supabase/functions/rit-chat/index.ts` line 107 correctly calls `userClient.auth.getUser(token)`.
- Edge logs at `14:17:10Z` still throw `userClient.auth.getClaims is not a function` at `index.ts:108:74` → the runtime is serving the pre-fix bundle.
- Previous "deploy" calls did not propagate. Needs a fresh forced redeploy.

### 2. High — `Loader2` lingering in Send button
- The plan removed `Loader2` from the typing indicator (now dancing dots ✅) but `RitChatPanel.tsx` line 335 still shows `<Loader2 className="animate-spin" />` inside the Send button while `sending`. Inconsistent with the new "no spinners" direction.
- Replace with a static `Send` icon + disabled state, or a tiny accent dot pulse.

### 3. Medium — "Clear conversation" is cosmetic only
- `setHiddenCleared(true)` only hides messages client-side. The backend still loads the full history on the next send → AI replies as if the cleared messages still exist, and the UI cap (`messageCount`) remains accurate to DB count, but the user sees `0 / 20` after clearing. Confusing.
- Either: (a) rename to "Hide conversation" and keep counter from DB, or (b) actually delete via a new `delete_rit_messages` path (RLS currently forbids DELETE).

### 4. Medium — history reload after clear is broken
- Once `hiddenCleared` is true, sending a new message keeps `hiddenCleared = false` (line 115), but `messages` state still holds the old history → the cleared messages re-appear. Likely not the intended UX.

### 5. Low — greeting can leak the answer in demo mode
- `computedGreeting` interpolates `challenge.correct_answer_summary` directly into the greeting bubble before the user even asks. On the live flow this is fine (post-attempt), but worth confirming `correct_answer_summary` is never passed pre-submit.

### 6. Low — unused imports
- `Loader2` will become unused after fix #2. Lint will flag it.

### 7. Low — system prompt leaks raw payload JSON
- `Payload: ${JSON.stringify(challenge.payload)}` (line 76) duplicates info already covered by the structured `correctSummary`. For `speed_round` and `issue_spotter` this dumps the entire answer key twice. Harmless but noisy and burns tokens.

### 8. Low — model choice
- Currently `google/gemini-3-flash-preview` (preview model). Stable choice for an Indian-law tutor would be `google/gemini-2.5-flash` (cheaper, GA, proven). Worth a swap unless preview latency is materially better.

### 9. Nit — accessibility
- Glitch title's cyan/magenta layers are `aria-hidden` ✅ but the base text has no `aria-label` distinguishing it; screen readers read "Reason It Through" once, which is fine. The `Rit` pill has `title=` but no `aria-label` — fine but could be more explicit.

### 10. Nit — chevron icon
- Was changed from `ChevronUp` to `ChevronDown` with rotation, good. But the `transition-transform` doesn't have `will-change` — minor jank possible on low-end devices. Skippable.

---

## Plan

### Phase A — unblock production (must do)
1. **Force redeploy `rit-chat`** via `supabase--deploy_edge_functions(["rit-chat"])`.
2. Verify next log entry is a clean boot with no `getClaims` error.
3. Smoke test: send one message in `/the-bar/preview` (demo mode, no edge call) and one on a real attempt (if a live attempt exists), confirm `bar_rit_messages` row count increases.

### Phase B — UX fixes
4. **Remove `Loader2` spinner from Send button** (`RitChatPanel.tsx` line 335) — use plain `<Send size={12} />` always; disabled state already conveys progress. Drop the `Loader2` import.
5. **Fix "Clear conversation" semantics** — rename button label to "Hide history" with a `title` tooltip explaining it only hides locally; keep `messageCount` derived from `messages.length` (not `visibleMessages`) so the cap reflects DB reality.
6. **Stop re-showing hidden messages on next send** — when `hiddenCleared` is true, on send keep filtering and append only new messages to a separate array, OR auto-reset `hiddenCleared` only after successful append (already does this, but also re-show old → fix by keeping `hiddenCleared` true and just appending).

### Phase C — backend polish
7. **Trim duplicate payload in system prompt** — drop the raw `Payload:` line; rely on `correctSummary` + `explanation`.
8. **Switch model** to `google/gemini-2.5-flash` for stability (one-line change).

### Phase D — verification
9. Tail `rit-chat` logs for 200 responses.
10. Confirm `bar_rit_messages` row inserts via `read_query`.

## Files

**Modified**
- `supabase/functions/rit-chat/index.ts` — drop raw payload line, swap model
- `src/components/bar/rit/RitChatPanel.tsx` — remove `Loader2` from Send button + import, rename Clear → Hide, fix hidden-message reappearance, derive `capReached` from `messages.length`

**Deployment**
- Force redeploy `rit-chat`

**Unchanged**
- `RitGlitchTitle`, `RitMessage`, `RitStarterChip`, `tailwind.config.ts`, DB schema, RLS, all animations

## Definition of Done

- Edge logs show a fresh boot with no `getClaims` errors.
- Real post-attempt chat returns an AI reply within ~5s.
- `bar_rit_messages` row count grows after a real chat.
- Send button no longer shows a spinning loader (consistent with the new dot indicator).
- Clearing the conversation does not reset the cap counter, and old messages stay hidden after the next reply.
- AI prompt no longer duplicates the answer key as raw JSON.

