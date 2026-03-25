

## Plan: Clear Q&A Data and Prepare for New Seed Content

### Current State
- 1 question exists ("asdsdasd") — test data
- 0 answers

### Steps

1. **Delete all existing bar_answers** (already empty, but run for safety)
2. **Delete all existing bar_questions** (1 row)
3. **Reset answer_count** (will be clean after delete)

These deletes need to run via the insert tool (data operations, not schema changes). Answers must be deleted first due to the foreign key on `question_id`.

After clearing, I'll wait for you to share the new Q&A content to seed into the database as Locus-branded entries.

### Note
The deletions will require a user_id with appropriate permissions. Since you have admin role setup, I'll use direct SQL DELETE statements via the data tool.

