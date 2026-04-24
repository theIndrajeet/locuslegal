## Plan

The database does have content: there are 4 approved challenges.

The current failure is frontend-side: the live preview is still sending this request:

```text
GET /bar_challenges_student?select=...,approved_at&order=approved_at.desc
```

But the student-safe view does not expose `approved_at`, so the backend returns:

```text
column bar_challenges_student.approved_at does not exist
```

That is why the page falls into the empty state even though questions exist.

### What I’ll do

1. Update the browse page query to use only columns that exist on `bar_challenges_student`:
   - select `created_at` instead of `approved_at`
   - order by `created_at desc`
2. Verify the `Challenge` type matches the safe view schema so there is no mismatch.
3. Rebuild/save the app so the preview is actually running the corrected code, then confirm the browse page shows the approved questions for guests and signed-in users.

### Technical details

Relevant view schema already shows:
- `created_at` exists
- `approved_at` does not exist

Relevant file:
- `src/pages/TheBarBrowse.tsx`

No new database migration is needed for this fix. The RLS/view access work is already in place; this is now a query/schema mismatch in the client.

Approve and I’ll apply the code fix and verify it in the preview.