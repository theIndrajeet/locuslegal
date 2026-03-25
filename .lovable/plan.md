

# Reddit-Style Threaded Replies + Delete for The Bar

## Summary
Add two features to The Bar: (1) authors can delete their own questions/answers with a confirmation dialog, and (2) answers support Reddit-style nested threading with a `parent_id` column for reply chains.

---

## Database Changes

### Migration: Add `parent_id` to `bar_answers` + cascade delete

```sql
-- Add parent_id for nested threading (nullable — top-level answers have NULL)
ALTER TABLE public.bar_answers
  ADD COLUMN parent_id uuid REFERENCES public.bar_answers(id) ON DELETE CASCADE;

-- Drop existing question_id FK and re-add with ON DELETE CASCADE
-- so deleting a question auto-removes all its answers
ALTER TABLE public.bar_answers
  DROP CONSTRAINT bar_answers_question_id_fkey;

ALTER TABLE public.bar_answers
  ADD CONSTRAINT bar_answers_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES public.bar_questions(id) ON DELETE CASCADE;
```

This gives us:
- `parent_id` — nullable self-reference for nested replies; `ON DELETE CASCADE` so deleting a parent answer removes its children
- `question_id` FK now cascades, so deleting a question removes all answers automatically

---

## Frontend Changes (all in `src/pages/TheBar.tsx`)

### 1. Delete functionality

**Question delete (detail view):**
- Show a `Trash2` icon button next to the question title, visible only when `user?.id === selectedQuestion.user_id`
- Clicking opens an `AlertDialog` with "Delete this question? All answers will be removed."
- On confirm: `supabase.from("bar_questions").delete().eq("id", id)` → navigate back to feed via `setSelectedQuestion(null)` + `fetchQuestions()`

**Answer delete:**
- Show `Trash2` icon on each answer where `user?.id === answer.user_id`
- AlertDialog: "Delete this answer? Any replies underneath will also be removed."
- On confirm: `supabase.from("bar_answers").delete().eq("id", id)` → `fetchAnswers()`

### 2. Threaded replies (Reddit-style)

**Data model changes:**
- Update the `Answer` interface to include `parent_id: string | null`
- Fetch all answers for a question flat (as today), then build a tree client-side

**Tree builder utility:**
```text
buildTree(answers[]) → tree nodes[]
  - Top-level = answers where parent_id is null
  - Each node has children[] = answers where parent_id === node.id
  - Sort children by votes descending
```

**Recursive `AnswerThread` component:**
```text
AnswerThread({ answer, children, depth })
  ├── Left border line (Reddit thread connector) — `border-l-2 border-accent/30`
  ├── Vote button + count
  ├── Answer body
  ├── Author + timestamp + "OP" badge if user_id matches question author
  ├── "Reply" button (toggles inline reply textarea)
  ├── Delete button (if owner)
  └── Recursively render children with depth+1
       - Max indent depth of 5 levels, then flatten
       - Each level indented with `ml-4`
```

**Reply flow:**
- Clicking "Reply" on an answer shows an inline `Textarea` + "Post Reply" button below that answer
- Submits to `bar_answers` with `parent_id` set to the answer being replied to, same `question_id`
- State: `replyingTo: string | null` tracks which answer has the reply box open

**Visual thread design (Reddit-inspired):**
- Vertical thread lines using `border-l-2` on each nesting level
- Collapse/expand toggle: a `[-]` / `[+]` button next to each answer with children — toggles showing/hiding the subtree
- State: `collapsedIds: Set<string>` tracks which threads are collapsed
- "OP" badge: small accent-colored badge shown next to author name when `answer.user_id === selectedQuestion.user_id`

### 3. New imports needed
- `Trash2`, `Reply`, `Minus`, `Plus` from `lucide-react`
- `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`

### 4. Updated answer count
- Answer count in feed cards should still count ALL answers (including nested replies) for a question — no change needed since we query all `bar_answers` by `question_id`

---

## Files

| Action | File |
|--------|------|
| Migration | Add `parent_id` column + cascade FKs |
| Edit | `src/pages/TheBar.tsx` — delete buttons, AlertDialog, threaded reply tree, collapse/expand, OP badge, inline reply |

