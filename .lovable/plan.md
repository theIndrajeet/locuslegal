

# Fix: Questions Not Rendering Despite Successful Fetch

## Root Cause
Network logs confirm the API returns 3 questions with status 200. The published site renders them correctly. The preview doesn't — meaning the data is fetched but lost before rendering. This is likely caused by a React state race condition: the auth `useEffect` triggers `setUser`/`setAuthReady` state updates which cause re-renders, and combined with `useCallback`/`useEffect` chaining for `fetchQuestions`, the questions state may be getting reset.

## Fix (in `src/pages/TheBar.tsx`)

**1. Add console.log debugging to isolate the exact failure point:**
- Log inside `fetchQuestions` after data arrives and after `setQuestions`
- Log `filtered.length` before rendering
- Log any caught errors with full details

**2. Simplify fetchQuestions to remove potential race condition:**
- Remove `useCallback` wrapper — use a plain `async function` inside `useEffect` directly
- This eliminates the stale closure / reference identity issues

**3. Add a `questionsLoaded` state for better rendering logic:**
- Track whether fetch has completed (separate from empty results)
- Show a loading spinner while fetching, "No questions yet" only after confirmed empty results

### Code changes:

Replace the current `useCallback` + `useEffect` pattern:
```tsx
// BEFORE (current)
const fetchQuestions = useCallback(async () => { ... }, [sort]);
useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
```

With a direct `useEffect`:
```tsx
// AFTER
useEffect(() => {
  let cancelled = false;
  const fetchQuestions = async () => {
    try {
      // ... same query logic ...
      if (!cancelled) {
        setQuestions(mapped);
      }
    } catch { if (!cancelled) toast.error("Failed to load questions"); }
  };
  fetchQuestions();
  return () => { cancelled = true; };
}, [sort]);
```

This prevents stale updates if the effect re-runs before the previous fetch completes.

**4. Keep `fetchQuestions` as a separate callable function for post-submit refreshes** (called after posting a question), but make the initial load use the `useEffect` pattern above.

## Files
| Action | File |
|--------|------|
| Edit | `src/pages/TheBar.tsx` — fix race condition, add cancellation, add debug logging |

