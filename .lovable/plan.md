

## Plan: Rename "judgyhelmet" to "locus" in The Bar

### Analysis
All seeded Q&A content was attributed to user `3a7ce47a-d597-470d-b21e-ce27bee27dec`. The display name "judgyhelmet" is stored in the `profiles` table. Since answers/questions reference the profile via `user_id`, we only need to update one row in `profiles`.

### Step
1. **Update the profile display_name** from "judgyhelmet" to "locus" for user `3a7ce47a-d597-470d-b21e-ce27bee27dec` using the insert tool (data UPDATE operation).

This single change will reflect across all Q&A cards in The Bar since they join on the profile.

