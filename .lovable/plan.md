

# Fix The Bar: Silent Query Failures

## Root Cause
`fetchQuestions` and `fetchAnswers` fail silently -- errors are only logged to `console.error` with no user feedback. When the join query `.select("*, profiles(display_name)")` encounters any issue, the entire feed breaks with zero indication to the user.

## Changes

### Edit `src/pages/TheBar.tsx`

**1. Add error toasts to `fetchQuestions`:**
- Replace `console.error(error); return;` with `toast.error("Failed to load questions"); return;`
- Add a try/catch wrapper around the entire function

**2. Add error toasts to `fetchAnswers`:**
- Add error handling that shows a toast instead of silently failing

**3. Make the join query more resilient:**
- Wrap the `profiles(display_name)` join in error handling -- if it fails, fall back to querying without the join and display "Anon" for all authors
- Add `.throwOnError()` to Supabase queries so errors are properly surfaced

**4. Fix the "Post Question" feedback loop:**
- After `submitQuestion` succeeds and `fetchQuestions` is called, add a toast or loading state so the user knows the post went through even if the refetch fails
- Show a loading spinner on the "Post Question" button while submitting

**5. Add error toast to `submitAnswer` and `submitReply`:**
- Ensure every database call has visible error feedback

## Files
| Action | File |
|--------|------|
| Edit | `src/pages/TheBar.tsx` -- add error toasts, resilient queries, loading feedback |

