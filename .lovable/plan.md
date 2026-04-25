## Goal
End the Legal Research Memo guide with an interactive "Before you send" checklist the reader can tick off when reviewing their own memo — converts passive advice into a usable working tool.

## Change
**File:** `src/content/playbook/legal-research-memo.mdx`

Replace the final `<Callout type="rule" title="Before you send">` block with:

1. A short H2 — `## Before you send` — so it reads as a real article section, not a tacked-on box.
2. One-line lead sentence: *"Run every memo through this list before it leaves your outbox."*
3. An interactive `<Checklist>` with these items (drawn directly from the lessons earlier in the article):
   - Issue stated in one sentence, sharp enough to fit in a tweet
   - Every cited judgment has been read in full (not just the headnote)
   - Statute checked for amendments; leading case checked for overrulings
   - Application section uses *these* facts, not facts in the abstract
   - Counter-arguments and risks addressed in their own section
   - Conclusion takes a position — hedged with reasoning, not vibes
   - Re-read the partner's original instruction; memo's first and last sentence answer it
   - Formatting clean: consistent fonts, working numbering, footnotes pointing to the right sources

## Why this approach
- `<Checklist>` already exists, already interactive, already registered in `mdxComponents.ts` — no new components.
- A real H2 (vs another Callout box) gives the section weight and makes it part of the article's structure rather than a sidebar.
- 8 items is the right size — comprehensive without being daunting. Each maps to a specific point made earlier in the guide.
- Replaces the existing closing Callout (avoids redundancy).

## Out of scope
No styling changes, no new components, no changes to other guides.