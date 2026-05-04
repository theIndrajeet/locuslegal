## Plan: Move Guidelines/Submission buttons to the marked area

I found the buttons are still rendered above the title in the opportunity modal hero band. I’ll move them to the bottom row of that same hero band, aligned with the `Posted ...` timestamp.

### Change in `src/pages/Opportunities.tsx`

1. Remove the current quick-link block from above the modal title.
2. Replace the standalone `Posted ...` paragraph with a flex row:

```text
Posted 4 MAY 2026                         [Guidelines] [Submission]
```

3. Keep the exact same link logic:
   - `Guidelines` uses `brochure_url`
   - `Submission` uses `submission_url`, `registration_url`, or `application_url` depending on stream
4. Use responsive wrapping so on narrow screens it becomes:

```text
Posted 4 MAY 2026
[Guidelines] [Submission]
```

### Result

The hero band order will be:

```text
[type pill]                              [countdown]
Title
Organiser
Posted 4 MAY 2026                       [Guidelines] [Submission]
```

No data/query/date logic changes.