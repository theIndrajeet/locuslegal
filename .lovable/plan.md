## Multi-email recognition in the application drafter

Right now the drafter passes `target.email` to Gmail/mailto verbatim. If a firm/vacancy lists multiple addresses (e.g. `intern@firm.com, hr@firm.com` or `intern@firm.com / partner@firm.com`), only the first character-for-character string ends up in the To field and the rest are silently dropped. Students miss the partner copy that firms often expect.

### Fix — `src/components/apply/DraftEmailDialog.tsx` only

1. **Add `parseEmailList(raw)` helper** that splits on commas, semicolons, slashes, the word "and", and whitespace, strips brackets/quotes, validates with a basic email regex, and de-dupes case-insensitively. Returns `{ to: firstAddress, cc: [...rest] }`.
2. **Update `buildGmailUrl(to, subject, body, cc[])`** to append `&cc=...` for the Gmail web URL and `&cc=...` for the mailto fallback.
3. **In `openInGmail()`**, replace the single `target.email` argument with `parseEmailList(target.email)` and pass `cc` through to `buildGmailUrl`.
4. **Toast feedback:** when CCs are auto-detected, swap the success toast to *"Opening Gmail. N address(es) auto-CC'd."* so the student knows it happened.

### Why this place
- All three sources (Vacancies, FirmDrawer, StartupDrawer) funnel through this one dialog, so the change covers every entry point with a single edit.
- The application-tracker logging stays unchanged (it stores `firm_name_snapshot`, not the email list).

### Out of scope
- No DB schema change. Vacancy `application_email` and firm/startup email columns continue to accept whatever string the admin enters — we just split it intelligently at send time.
- No edits to `draft-application-email` edge function (it never sees the recipient).
- The `<input value={target.email}>` recipient preview in the dialog (if any) is left as-is — the parsed split happens only when opening Gmail/mailto.