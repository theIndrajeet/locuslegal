## Locus+ Premium Hardening — Round 2

### 1. State reset on challenge change (`src/pages/TheBarChallenge.tsx`)
Add a `useEffect([challenge?.id])` that resets ALL premium navigation state to defaults whenever a new challenge loads:
- `briefStep` → 0
- `counselingTurn` → 0
- `ethicsStage` → 'decide'
- `docReviewFlagged` → []
- any per-type local answer state

This prevents `payload.steps[briefStep]` style crashes when navigating from a 5-step brief to a 3-step brief.

### 2. Brief Builder review correctness tint (`src/components/bar/AttemptReviewDialog.tsx`)
In `BriefBuilderReview`, when the payload contains an answer key (admin review), compare `submitted.step_answers[i]` against `payload.steps[i].correct_*` and tint the stepper button:
- match → emerald border/text
- mismatch → rose border/text
- no key available (student-stripped payload) → neutral (current behaviour)

### 3. Document Review min height (`src/components/bar/premium/PremiumDocumentReview.tsx`)
Add `min-h-[60vh]` to the root grid container so short documents don't collapse and overlap the footer.

### 4. Delete obsolete legacy renderers
The four premium types now route exclusively through `Premium*` components. The legacy renderers are dead code that still references stripped `correct_*` keys in their TS interfaces — a future regression risk.

Delete:
- `src/components/bar/renderers/EthicsRenderer.tsx`
- `src/components/bar/renderers/ClientCounselingRenderer.tsx`
- `src/components/bar/renderers/BriefBuilderRenderer.tsx`
- `src/components/bar/renderers/DocumentReviewRenderer.tsx`

Remove their imports from `AttemptReviewDialog.tsx` and `TheBarChallenge.tsx`.

### 5. Guest access RLS policy (new migration)
Currently `bar_challenges_student` runs with `security_invoker = true`, so `anon` needs base-table SELECT to read approved challenges in guest preview. Add:

```sql
CREATE POLICY "Anon can read approved bar_challenges"
  ON public.bar_challenges
  FOR SELECT
  TO anon
  USING (status = 'approved');
```

The view itself strips all `correct_*` keys, so anon still cannot see answers. Authenticated paths are unchanged.

### Out of scope
- No payload schema changes
- No edge function changes
- No new tables