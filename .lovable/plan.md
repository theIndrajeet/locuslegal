

# Rit — "Reason It Through" post-answer chat

After a student sees the explanation, drop in a chat panel where they can debate the answer, ask follow-ups, or get clarification.

**Naming**: Feature is called **"Reason It Through"** everywhere user-facing. The short form **"Rit"** only appears as a small UI affordance — the chat header pill, the assistant's bubble label, and the typing indicator (`Rit is thinking…`). No "with Rit" phrasing anywhere. Easter-egg dedication lives only in a code comment.

## Where it appears

Gated behind a successful answer submission so it can't be used as a cheat tool:

1. **`ResultScreen`** (right after submit on `TheBarChallenge`) — collapsed card under the "Why?" explanation: *"Reason It Through →"*. Click expands to chat.
2. **`AttemptReviewDialog`** (review past attempts) — same card under the explanation; conversation persists per-attempt.

Not shown on `/the-bar/preview` (no real attempt to anchor to).

## UX

- Card with neobrutalist 2px border. Header: **"Reason It Through"** title + tiny `Rit` accent pill on the right.
- Auto-greeting from question context: *"The answer was C because [one-liner]. What part would you like to dig into?"* — labeled as **Rit** in the bubble.
- 3 starter chips: **"Why isn't B correct?"**, **"Cite the leading case"**, **"Give me a similar hypo"**.
- Markdown rendering (`react-markdown`) for assistant messages.
- Input + Send; Enter sends, Shift+Enter newline; 1500-char cap; disabled while loading.
- Typing indicator: `Rit is thinking…`
- Per-attempt cap: **20 messages**, then soft lock with "Start a fresh challenge" CTA.
- "Clear conversation" link in header (local-only hide for v1).

## Data model (1 migration)

New table `bar_rit_messages`:
- `id uuid pk`, `attempt_id uuid fk → bar_attempts(id) on delete cascade`
- `user_id uuid` (denormalized for RLS), `role text check (role in ('user','assistant'))`
- `content text`, `created_at timestamptz default now()`
- Index on `(attempt_id, created_at)`

RLS: user can `select`/`insert` only where `user_id = auth.uid()` AND parent attempt belongs to them (verified via `exists` subquery on `bar_attempts`). No client update/delete.

## New edge function: `rit-chat`

Path: `supabase/functions/rit-chat/index.ts`. Same auth pattern as `chat-legal` (JWT required).

Body: `{ attempt_id: string, message: string }`.

Server flow:
1. Validate JWT, load `bar_attempts` + joined `bar_challenges`, confirm `attempt.user_id === claims.sub` else 403.
2. Enforce 20-message cap.
3. Load existing `bar_rit_messages` (ordered) for full history.
4. System prompt: senior Indian-law tutor; ground answers in Indian statutes/cases; **never reveal answers to other questions**; explain why a wrong theory is wrong; refuse off-topic; ~250 words max. Includes question prompt, options/payload, correct answer, official explanation, what user submitted, whether they got it right.
5. Call Lovable AI Gateway `google/gemini-3-flash-preview`.
6. 429 → "Rit is taking a breather — try again in a moment." 402 → "Rit is out of credits."
7. Insert user message + assistant reply, return `{ reply, message_count }`.

Non-streaming for v1.

## New client components

- `src/components/bar/rit/RitChatPanel.tsx` — collapsible card; props `{ attemptId, challenge, attempt }`.
- `src/components/bar/rit/RitMessage.tsx` — bubble with `react-markdown`, role-coloured.
- `src/components/bar/rit/RitStarterChip.tsx` — neobrutalist chip.

## Wire-up

- `src/components/bar/ResultScreen.tsx` — accept `attemptId` + `challenge` props; render `<RitChatPanel>` after explanation.
- `src/pages/TheBarChallenge.tsx` — pass `attemptId` and challenge to `ResultScreen`.
- `src/components/bar/AttemptReviewDialog.tsx` — render `<RitChatPanel>` after the "Why?" card.

## Dependency

Add `react-markdown` if not already installed.

## Easter egg

Single dedication comment at the top of `RitChatPanel.tsx`. UI never reveals the name.

## Out of scope (v1)

Sharing/export, streaming, mid-question access (cheating risk), admin moderation UI, billing.

## Definition of Done

After answering any challenge, a "Reason It Through" card appears below the explanation with a small `Rit` pill. Expanding shows greeting + 3 chips. Sending gets a contextual reply within ~5s, grounded in the question + correct answer. Conversation persists across `/the-bar/history` revisits. After 20 messages, input locks. Wrong-user requests to `rit-chat` get 403. The `/the-bar/preview` page is unchanged.

