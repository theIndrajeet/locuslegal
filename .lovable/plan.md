# Auto-retry on transient cold-start failures

## Problem
First click on "Generate" returned `Error: Load failed` — a fetch-level network failure (no HTTP response, no edge function log entry). The exact same payload succeeded 14s later. Classic edge function cold-start blip.

## Fix
In `src/components/apply/DraftEmailDialog.tsx` `generate()`:
- Extract the invoke call into a local `invokeOnce()` helper.
- After the first call, detect transient failures: `error` is set AND there's no `error.context.response` (so no HTTP response was received) AND message matches `/load failed|failed to fetch|network|timeout/i`.
- Wait 800ms, then retry once silently.
- If the retry also fails, surface the toast as before.

User sees one slightly longer "Drafting…" instead of an error + manual retry. No backend changes.
