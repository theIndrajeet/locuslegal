## Bulk import: 15 issue_spotter questions

### What I validated
- All 15 items conform to the `IssueSpotterPayloadSchema` (`issue_options` 3–10, `correct_issue_ids` non-empty and all reference an option `id`).
- All `area_of_law` values are valid enum members (`contract`, `constitutional`, `torts`, `criminal`, `family`, `corporate`, `property`, `administrative`, `ip`).
- All `difficulty` values are valid (`easy`, `medium`, `hard`).
- Distribution: 5 easy, 5 medium, 5 hard.

### Field mapping (input → DB column)
- `title`, `question_type`, `area_of_law`, `difficulty`, `prompt`, `explanation`, `payload` → same columns.
- `citation` (input) → `source_citation` (DB column).
- `points_base` not supplied → defaulted by difficulty using the project's dominant convention: **easy = 50, medium = 75, hard = 100**.
- `status = 'approved'`, `approved_at = now()`, `approved_by = <admin uid>`, `created_by = <admin uid>`, `notified_at = now()` (so even if the trigger were re-enabled, these would not re-fire).

### Notifications
- The `bar_challenges_notify_new_after_iu` trigger is already DISABLED from the previous batch — it will stay disabled. No emails will be sent for this import. (Re-enable later when you say "resume bar emails".)

### Execution
1. Resolve admin user id (your account) for `created_by` / `approved_by`.
2. Single `INSERT … VALUES (…), (…), …` into `public.bar_challenges` for all 15 rows via the insert tool.
3. Verify count + sample with a `SELECT`.

### Safety
- No schema changes, no migration needed.
- Trigger remains disabled — zero outbound email risk.
- Inserts are idempotent in spirit (no UNIQUE on title), so I'll just confirm count delta after insert.