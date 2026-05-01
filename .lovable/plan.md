## Insert Batch 06 — Brief Builder Challenges

Following the same pattern as batches 01–05.

### What's in the batch
6 `brief_builder` challenges (all `difficulty: easy`):
1. Breach of Contract — Damages Claim (contract)
2. Writ Petition — Dismissal Without Inquiry (administrative)
3. Bail Application — Default Bail (criminal)
4. Medical Negligence — Consumer Complaint (torts)
5. Consumer Complaint — Hotel Booking Deficiency (other)
6. (6th item — will read remaining lines before insert)

### Migration

Single SQL migration that inserts all 6 rows into `public.bar_challenges` with:
- `question_type = 'brief_builder'`
- `difficulty = 'easy'` → `points_base = 50` (matches existing easy brief_builder rows)
- `status = 'approved'` (so they appear in /the-bar/browse immediately, matching prior batches)
- `created_by = 3a7ce47a-d597-470d-b21e-ce27bee27dec` (admin profile id)
- `approved_by` = same admin id, `approved_at = now()`
- `payload` = the full JSON `payload` block from the file (fact_pattern, citation, steps[])
- `title`, `prompt`, `explanation`, `source_citation` copied from each item
- `area_of_law` mapped from each item's `area_of_law` field

### No code changes
- Renderer `BriefBuilderRenderer.tsx` and `PremiumBriefBuilder.tsx` already handle this payload shape (mcq + order step kinds) — confirmed by the 3 existing approved brief_builder rows.
- No schema, RLS, or UI changes needed.

### After insert
- The 6 challenges will appear in `/the-bar/browse` filtered by Brief Builder / Easy.
- Email notifications stay paused per current preference (email domain fix in progress) — `notified_at` left NULL but the dispatcher is paused, so no broadcast goes out.
