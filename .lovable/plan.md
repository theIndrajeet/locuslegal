# Plan

## 1. Hide expired opportunities from public board

`src/pages/Opportunities.tsx` (lines 72-77): drop the 30-day archived window. Query only `status = 'live'` AND `expires_at > now()` for vacancies, cfps, moots, competitions. Closed/expired items disappear from the board immediately. Admin views unchanged.

## 2. Seed 8 NLSIU Calls for Papers

Insert into `cfps` (status `live`, `created_by` = admin user for `heyjeetttt@gmail.com`, `source_credit` = "NLSIU", `co_authorship_allowed` = true, `submission_fee` = "No fees", `peer_reviewed` = true except NLSJ general which is mixed → mark true since flagship is peer-reviewed). For rolling/general calls without a stated deadline, use **2026-12-31 23:59 IST** as a placeholder so they remain visible. `expires_at` = same as `submission_deadline`. `brochure_url` = NLSIU calls page `https://www.nls.ac.in/research/nlsiu-journals/`. Each row gets a rich `description` paragraph + theme list.

| # | publication_name | submission_deadline (IST) | submission_url |
|---|---|---|---|
| 1 | National Law School Journal (NLSJ) — General Call | 2026-12-31 23:59 | https://repository.nls.ac.in/nlsj |
| 2 | International Journal on Consumer Law and Practice (IJCLP) — Vol 14 General Issue | 2026-05-30 23:59 | https://repository.nls.ac.in/ijclp/ |
| 3 | Journal of Law and Public Policy (JLPP) — Vol 9(2) General Issue | 2026-01-31 23:59 | https://repository.nls.ac.in/jlpp/ |
| 4 | JLPP — Vol 10(1) Special Issue: New Urbanism and its Contours of Inclusion | 2026-01-31 23:59 | https://repository.nls.ac.in/jlpp/ |
| 5 | Socio-Legal Review (SLR) — General Call | 2026-12-31 23:59 | https://repository.nls.ac.in/slr |
| 6 | SLR — Vol 22(2) Special Issue: Law and History in South Asia | 2026-04-15 23:59 | https://repository.nls.ac.in/slr |
| 7 | Indian Journal of Law and Technology (IJLT) — Vol 22(1) & 22(2) General | 2026-05-15 23:59 | https://repository.nls.ac.in/ijlt |
| 8 | Indian Journal of International Economic Law (IJIEL) — Vol 17(2) Special: Digital Competition Regulation & IEL | 2026-05-08 23:59 | https://repository.nls.ac.in/ijiel |

For row #2 (IJCLP), include the submission-guidelines URL `https://repository.nls.ac.in/ijclp/policies.html` inside the `description` body (markdown-style line: "Submission guidelines: …"), since the schema has no separate guidelines column.

Done via `INSERT` (data op — uses insert tool, no migration).

## Out of scope
- No schema changes, no admin UI changes.
- Existing seeded NUSRL Symposium row remains.
