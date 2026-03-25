

## Plan: Fix Auth Page Issues

### Issue 1: "Forgot password?" link on wrong form
The `{!isLogin && ...}` condition (line 200) shows it during **sign-up**. It should be `{isLogin && ...}` to show during **sign-in**. Also, the forgot password handler requires `email` but the login form only has `username` — so we need to modify it to resolve the email from the username first, or show an email input for password reset.

**Fix**: Change `{!isLogin &&` to `{isLogin &&` on line 200, and update `handleForgotPassword` to use the `get_email_by_username` RPC to resolve the email from the username field (since login uses username, not email).

### Issue 2: The Bar questions not loading (profiles join fails)
The `bar_questions` table has no foreign key to `profiles`, so the Supabase `.select("*, profiles(display_name)")` join fails. The fallback plain query works but loses author names. 

**Fix**: Add a foreign key from `bar_questions.user_id` to `profiles.id` and from `bar_answers.user_id` to `profiles.id` via a migration. This makes the join work properly.

### Changes

1. **Migration**: Add foreign keys `bar_questions.user_id → profiles.id` and `bar_answers.user_id → profiles.id`
2. **Auth.tsx** (line 200): Change `{!isLogin &&` to `{isLogin &&`
3. **Auth.tsx** `handleForgotPassword`: Look up email via `get_email_by_username` RPC using the username field, then call `resetPasswordForEmail`

