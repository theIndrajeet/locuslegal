

## Fix: flagged spans don't wrap, breaking clause numbering alignment

**Problem.** In `PremiumDocumentReview`, each flaggable phrase is rendered as a `<button>` (Popover trigger). Browsers treat `<button>` as an atomic inline-block — its text **cannot wrap across lines**. So when a flagged span is a long sentence (clauses 2, 4, 5 in the NDA mock), the entire button gets pushed onto its own line, leaving the "2." / "4." / "5." number stranded above it.

The same issue exists in review mode for any long correct/missed span wrapped in a styled `<span>` with `inline-block`-ish styling.

**Fix (single file: `src/components/bar/premium/PremiumDocumentReview.tsx`).**

1. Replace the `<button>` PopoverTrigger with an inline element that allows text to wrap:
   - Use `<PopoverTrigger asChild><span role="button" tabIndex={0} …>` instead of `<button>`.
   - Add `display: inline` (Tailwind `inline`) and `box-decoration-break: clone` (`[box-decoration-break:clone] [-webkit-box-decoration-break:clone]`) so the dotted underline / amber highlight / border render correctly across line breaks.
   - Keep keyboard support: `onKeyDown` opens the popover on Enter/Space; keep `aria-disabled` while grading.

2. Apply the same `inline` + `box-decoration-break: clone` treatment to the review-mode `<span>` (correct hit / missed / false-flag) so long spans wrap inline rather than forming a block.

3. Remove `whitespace-pre-wrap` from the body container and instead emit explicit `\n\n` paragraph breaks by splitting `text` segments on `\n\n` into separate `<p>` blocks (or render `\n\n` as `<br/><br/>`). `whitespace-pre-wrap` is fine, but combined with inline-block buttons it amplifies the wrapping issue; switching to real paragraphs makes the clause numbers reliably hug the sentence start.

**Acceptance.**
- On `/the-bar/preview` Document Review tab, clauses 2, 4, 5 render as `2. The Recipient irrevocably waives…` on a single flowing paragraph (with the long span wrapping naturally across lines), not with the number stranded above.
- Clicking a flagged phrase still opens the category popover; keyboard (Enter/Space) still works.
- Review mode (correct/missed/false-flag) keeps its color treatment across line wraps with no gaps in the underline/highlight.
- No changes to payload shape, grading, or other renderers.

