

# Show Rit on the preview page (demo mode)

The preview at `/the-bar/preview` currently shows the renderers in Answer/Review modes but never shows the **Reason It Through (Rit)** panel — so visitors can't see the new feature. Add a demo version of Rit that appears in **Review** mode on the preview page only.

## Approach

Add a `demoMode` prop to `RitChatPanel` that:

- Skips the DB history load (no real `attempt_id` exists).
- Routes "send" to a small canned-reply function instead of the `rit-chat` edge function (no auth, no cost, no logging).
- Keeps the **exact same UI**: collapsible card, header pill, greeting, starter chips, typing indicator (1.2s simulated delay), markdown rendering, message cap, clear-conversation, character cap.
- Disables persistence — refreshing resets the demo conversation.

This way, the production behaviour stays untouched and we get a faithful visual demo with zero backend dependency.

## Canned demo replies

A tiny in-file map keyed off the starter chip labels plus a generic fallback:

- *"Why isn't my answer correct?"* → 2-paragraph markdown explaining why the user's choice was wrong, grounded in the sample question's domain.
- *"Cite the leading case"* → bullet list of 1-2 plausible Indian cases relevant to that sample.
- *"Give me a similar hypothetical"* → a short hypo that tests the same rule.
- Anything else typed → friendly "In the live version I'd reason this through with you using the actual question context. This is a static demo — try the chips above."

One canned set per sample question type (MCQ, Issue Spotter, Jurisdiction, Speed Round), so the demo feels relevant to whichever tab is open.

## Where it appears in the preview

Inside `PreviewShell`, only when `mode === "review"` and the sample has an explanation:

- Render the existing explanation card.
- Right under it, render `<RitChatPanel demoMode demoReplies={...} attemptId="preview" challenge={...} defaultOpen={false} />`.

Speed Round's review block already shows a `perQuestion` table — Rit appears under that.

A small muted note above Rit on the preview: *"Demo mode — replies are canned. The real tutor uses your actual attempt."*

## Files

**Modified**
- `src/components/bar/rit/RitChatPanel.tsx` — add `demoMode?: boolean` and `demoReplies?: Record<string, string>` props; when `demoMode`, skip the history fetch and the edge-function call, simulate a typing delay, and pull replies from `demoReplies` (with a default fallback). No other behaviour changes.
- `src/pages/TheBarPreview.tsx` — wire `<RitChatPanel demoMode … />` into `PreviewShell` review mode for each of the 4 sample types, with type-specific `demoReplies` and a short demo-mode note.

**Unchanged**
- `rit-chat` edge function, `bar_rit_messages` table, RLS, `ResultScreen`, `AttemptReviewDialog`, `TheBarChallenge` — all untouched.

## Definition of Done

Visit `/the-bar/preview` → switch any tab to **Review** → a "Reason It Through" card with the `Rit` pill appears under the explanation. Expanding it shows the greeting + 3 starter chips. Tapping a chip shows `Rit is thinking…` for ~1.2s, then a markdown-rendered canned reply relevant to that question type. Typing a custom message returns the friendly demo-mode line. The 20-message cap and Clear Conversation still work. Production usage on real attempts is byte-identical to before.

