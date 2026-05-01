## Insert Batches 07 & 08 — Ethics + Client Counseling

Same pattern as batches 01–06.

### What's in the batches

**Batch 07 — `ethics` (15 challenges, area_of_law = `other`)**
- 5 easy (Conflict of Interest, Confidentiality, Forged Document, Competence, Fee Recovery)
- 5 medium (Client Perjury, Dual Representation, Withdrawal/Document Fraud, Privileged Document, Client Autonomy)
- 5 hard (False Alibi, Ongoing Client Fraud, Substantial Relationship, Duty of Candor, Ex Parte Communication)

**Batch 08 — `client_counseling` (15 challenges, varied areas)**
- 5 easy: Cheque Dishonour (criminal), Eviction (property), Termination (labour), Defective Goods (other), FIR/Robbery (criminal)
- 5 medium: Domestic Violence (family), Founder Dispute (corporate), GST Raid (tax), Land Acquisition (property), Shareholder Oppression (corporate)
- 5 hard: Surveillance/Privacy (constitutional), Foreign Award Enforcement (international), Environmental Clearance (environmental), Medical Negligence (torts), Cross-Border Insolvency (corporate)

### Mapping to `bar_challenges`

| difficulty | points_base |
|------------|-------------|
| easy       | 50          |
| medium     | 75          |
| hard       | 100         |

(Confirmed against existing approved rows of the same `question_type`.)

Each row also gets:
- `status = 'approved'` — visible in `/the-bar/browse` immediately
- `created_by = approved_by = 3a7ce47a-d597-470d-b21e-ce27bee27dec` (admin profile)
- `approved_at = now()`
- `notified_at = now()` — **email pause respected**: this skips the `bar_challenges_notify_new_fn` trigger, which only fires when `notified_at IS NULL`. No outbound emails.
- `payload` = full JSON payload from the file (verbatim)
- `title`, `prompt`, `explanation`, `source_citation` copied from each item
- `area_of_law` per item

### No code changes
- `EthicsRenderer` / `PremiumEthics` payload shape (`decision_options`, `correct_decision_id`, `consequence_text`, `followup_options`, `correct_followup_id`, `model_reasoning`) matches the file exactly — verified.
- `ClientCounselingRenderer` / `PremiumClientCounseling` payload shape (`matter`, `transcript`, `decision_turns[].options`, `correct_option_id`) matches — verified.
- No schema, RLS, or UI changes.

### Execution

Stage both JSON files into `/tmp`, generate one bulk SQL transaction (parameterised via Python to safely escape `jsonb`), run via `psql` in a single transaction. Verify counts after insert:

```text
SELECT question_type, difficulty, count(*)
FROM bar_challenges
WHERE created_at > now() - interval '5 minutes'
GROUP BY 1, 2;
```

Expect: ethics 5/5/5 + client_counseling 5/5/5 = 30 new rows, all `status=approved`, all `notified_at` populated.

### After insert
- 30 challenges live on `/the-bar/browse` (filterable by Ethics or Client Counseling, all 3 difficulties).
- Zero email notifications dispatched (matches the active "pause email notifications until domain fix" instruction).
