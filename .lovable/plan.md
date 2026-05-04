You’re right — the current “Regenerate with current brief” is too opaque. If the draft already exists, there’s no obvious place to add new facts, and the backend treats the brief as a general hint rather than a strong rewrite instruction. I’ll make this feel like an actual cover-letter editor, not just another random generation button.

Plan:

1. Add an “Add rewrite notes” box above the regenerate button
- Place it directly above “Regenerate with current brief” when a draft already exists.
- Label it clearly, e.g. “Tell Locus what to change or add”.
- Use a multi-line textarea, not a one-line input.
- Placeholder examples:
  - “Mention my Intellect internship and DPDP work.”
  - “Make it less generic and more corporate-law focused.”
  - “Cut the college line, strengthen the middle paragraph.”
  - “Add that I’m available in June for the Bangalore office.”
- Add quick suggestion chips users can tap, such as:
  - “Make it sharper”
  - “Add more personality”
  - “Sound less AI-written”
  - “Focus on corporate/M&A”
  - “Make it shorter”
  - “Use my strongest CV point”
- Keep it editable so the user can combine chips with their own notes.

2. Add a true rewrite mode to the generation call
- Add a new `rewrite_notes` state in `DraftEmailDialog.tsx`.
- When the draft exists and the user clicks regenerate, send:
  - the current subject
  - the current body
  - the rewrite notes
  - the current brief/profile/recipient type
- This means regeneration will no longer start from scratch blindly; it will explicitly rewrite the visible draft using the user’s instructions.

3. Strengthen the backend prompt for visible differences
- Update `draft-application-email` to accept `rewrite_notes` and `current_draft`.
- If those are present, the server prompt will say:
  - preserve only the accurate facts
  - apply the user’s rewrite notes strongly
  - rewrite at sentence level, not just lightly paraphrase
  - make the result noticeably different from the current draft
  - remove generic filler and add one concrete, user-provided point where possible
- If rewrite notes are empty, still regenerate, but force a different structure/opening from the previous draft so the user sees a meaningful difference.

4. Make v2 more visibly active in the UI
- Add a small “Style engine checks: Indian recruiter format, AI-tell cleanup, British English” note near the draft/warnings area.
- When warnings exist, keep the amber banner.
- If no warnings exist, show a subtle success line so users know the validator actually ran.

5. Tighten the “current brief” caching issue
- Right now the cache only stores the draft, and brief changes can feel disconnected once the draft is already generated.
- I’ll make sure regenerate uses the latest brief + rewrite notes, then updates the cached draft and cached brief together.

Technical files to change:
- `src/components/apply/DraftEmailDialog.tsx`
  - Add rewrite notes state, textarea, suggestion chips, and updated regeneration payload.
- `supabase/functions/draft-application-email/index.ts`
  - Extend request validation.
  - Add rewrite-specific prompt block.
  - Continue running the existing validator after rewrite.
- `mem://features/cover-letter-engine`
  - Update memory so future changes preserve this rewrite-box behaviour.

Expected result:
- Users can write: “Add that I worked on cross-border data privacy across 190 countries and make it less generic.”
- Clicking regenerate should produce a draft that visibly incorporates that point and changes the structure/tone, rather than returning almost the same email.