# Plan — Open up portal jobs, add tier filter, personalise the feed, then scale supply

Three sequential phases: **A** (external portals + tier taxonomy + smart drafter) → **C** (Recommended for you) → **B** (3-source aggregator). No follow-firm/alerts (D) per your call.

---

## Phase A — External-portal listings + Tier taxonomy + Smart Drafter

**Goal:** Unblock Tier-1 firms, Big-4, in-house roles that only accept via portal. Add tier as a first-class filter dimension. Make the admin drafter auto-detect portal-only postings and demand the link.

### Database (1 migration)

Add to `vacancies`:
- `application_mode` enum: `email | external_url` — default `email`
- `application_url text` — required when mode=external_url
- `tier` enum: `tier_1 | tier_2 | tier_3 | boutique | in_house | psu | big_4 | other` — nullable (legacy rows)
- `practice_area text` — free text initially. Hardened to enum in Phase B once we see real values.

Update `vacancies_validate_fn` trigger:
- if `application_mode = 'email'` → `application_email` required (current behaviour)
- if `application_mode = 'external_url'` → `application_url` required + must match `^https?://` + sane length, `application_email` may be null
- Drop NOT NULL on `application_email` at column level; trigger enforces conditionally

Extend `application_method` enum on `profile_applications` with `external` value.

### `extract-vacancy` edge function — smart inference

Extend the LLM tool schema:
```ts
application_mode: 'email' | 'external_url'
application_email: string | null   // null when mode=external_url
application_url:   string | null   // required when mode=external_url
tier:              'tier_1'|'tier_2'|'tier_3'|'boutique'|'in_house'|'psu'|'big_4'|'other'|null
practice_area:     string | null
```

Prompt additions (rules the model follows):

**Application mode detection — in priority order:**
1. If text contains a valid email → `application_mode='email'`, set `application_email`.
2. Else if text contains a URL matching any of these patterns → `application_mode='external_url'`:
   - Workday: `*.myworkdayjobs.com/*`, `*.workday.com/*`
   - SuccessFactors: `*.successfactors.com/*`, `career*.sapsf.com/*`
   - Greenhouse: `boards.greenhouse.io/*`, `*.greenhouse.io/jobs/*`
   - Lever: `jobs.lever.co/*`
   - LinkedIn: `linkedin.com/jobs/view/*`
   - Naukri: `naukri.com/job-listings-*`
   - Generic careers/portal hints: URL path contains `/careers`, `/jobs`, `/apply`, `/job-application`
   - Firm-specific known portals: `careers.ey.com`, `careers.deloitte.com`, `kpmgindia.taleo.net`, `pwc.wd3.myworkdayjobs.com`, `talent.cyrilshroff.com`, etc.
3. Else if no email AND no URL but text mentions "apply via our portal", "submit through our careers page", "via company website" → `application_mode='external_url'`, `application_url=null` (admin must paste).
4. Else → `application_mode='email'`, `application_email=""` (admin UI rejects, prompts for email).

**Tier inference (only when unambiguous):**
- `tier_1`: CAM/AMSS, AZB, Trilegal, Khaitan & Co, L&L Partners / Luthra, JSA, SAM, ELP, S&R, Talwar Thakore, Argus, IndusLaw
- `big_4`: EY, Deloitte, KPMG, PwC, Grant Thornton, BDO
- `in_house`: phrases like "in-house counsel", "legal team at [Company]", "[BigTech/Startup] legal"
- `psu`: ONGC, BHEL, NTPC, SAIL, BPCL, IOCL, GAIL, etc.
- Else `null` (admin selects manually).

**Practice area:** infer one of {Corporate, M&A, Disputes/Litigation, IP, TMT, Banking & Finance, Tax, Competition, Real Estate, Employment, Policy/Regulatory, General} from role title + description. Else `null`.

### `AdminVacancyDialog` — the drafter UX

**Step 1 (paste) — unchanged**, but on `extract` response now also returns `application_mode`, `application_url`, `tier`, `practice_area`.

**Step 2 (form) — new behaviour:**

Top of form: a clear **Apply via** segmented control (radio):
```
( ● Email )    ( ○ Company portal )
```
Pre-selected to whatever the extractor decided.

**When `Email` is selected:**
- Show `application_email` field (existing, required).
- Hide `application_url`.
- Existing dedupe banner stays the same (firm + email + role).

**When `Company portal` is selected:**
- Hide `application_email`.
- Show `application_url` field (required, validated against `^https?://`).
- If extractor returned `application_url=null` (rule 3 above — post mentioned a portal but didn't paste a URL), show a prominent **yellow neobrutalist callout** above the URL field:

  > **Portal link missing.** This post says applications go through the company's careers page, but no URL was pasted. Add the direct link to the job opening so applicants can reach it in one click.
  >
  > [Open google search for "[Firm] [Role] careers" →]  ← convenience button, opens new tab pre-filled

- Save button **disabled** with tooltip "Add the portal URL" until URL is filled.
- Dedupe key for portal mode = firm + normalized URL host+path (not email). Update `vacancy-dedupe.ts` to handle both modes.

**Always visible (both modes):**
- New **Tier** select (8 options + "Not sure / Other") — pre-filled from extractor.
- New **Practice area** combobox (free text, with the 12 suggestions above as quick-pick chips) — pre-filled from extractor.
- Existing fields (role, location, eligibility, stipend, description, task_brief, expires_in_days, source_credit) unchanged.

**Mode-switch safety:** Toggling between Email ↔ Portal preserves the field that's hidden so accidental clicks don't destroy data. Only the active field is validated on save.

### `vacancy-dedupe.ts` updates

Add to `DupeCandidate`: `application_mode`, `application_url`.
- Email mode: existing logic (firm + email + role similarity).
- Portal mode: hard match if `firm` matches AND `normalize(application_url)` matches (strip `?utm_*`, fragment, trailing slash).
- Cross-mode: if the same firm + role appears once as email and once as portal, surface as soft match — admin decides.

### `VacancyCard` — branching apply behaviour

When `application_mode = 'external_url'`:
- Replace **Draft application** button with **Apply on portal →** (`ExternalLink` icon).
- Click flow:
  1. Open the existing **DraftEmailDialog** in new `cover_letter_only` mode → user gets a tailored cover letter + bullet points to copy.
  2. Bottom of that dialog: **Continue to portal →** button → opens `application_url` in new tab AND logs to `profile_applications` with `method='external'`.
- 7-day follow-up reminder logic stays (works off `applied_on`).
- Add small tier pill on card header next to Job/Internship pill: `TIER 1`, `BIG 4`, `IN-HOUSE`, etc. — neobrutalist border, no fill. Hidden when `tier=null`.

### `DraftEmailDialog` — new mode

Add prop `mode?: 'email' | 'cover_letter_only'`. In `cover_letter_only`:
- Hide "Send via Gmail" / "Open in mail client" actions.
- Show **Copy cover letter**, **Copy tailored bullets**, **Continue to portal →**.
- Heading copy: "Tailored cover letter for [Firm] portal application".

### `Opportunities.tsx`

Below the existing stream filters (Career group only), add a **Tier** filter chip row:
`All | Tier 1 | Tier 2 | Boutique | In-house | PSU | Big 4 | Other`
Multi-select chips, AND-ed with stream filter.

---

## Phase C — "Recommended for you" section

**Goal:** Same supply, feels curated. Visible section above the main grid (not silent reorder).

### Profile additions

Two new editable fields on `ProfileEdit` → `profiles`:
- `target_tiers text[]` — multi-select chips of the 8 tiers
- `target_locations text[]` — chips: Delhi NCR, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Remote, Other

`subjects_of_interest` (already exists) doubles as practice-area preference.

### Ranking (client-side, pure function + tests)

`src/lib/opportunity-ranker.ts` — given an opportunity + profile, returns `{ score, reasons[] }`:
- +30 if `tier ∈ profile.target_tiers`
- +20 if `location` matches any `target_locations` (substring, case-insensitive)
- +25 if `practice_area` overlaps with `subjects_of_interest`
- +15 if posted within last 48h (freshness)
- +10 if `eligibility` mentions user's `degree` / `graduation_year`
- −50 if user already has `profile_application` for this firm+role

`reasons` → human chips: *"Matches your IP interest"*, *"Tier 1 · Mumbai"*, *"Posted 6h ago"*.

### `Opportunities.tsx` UI

Above the existing grid (Career group only, signed-in users with ≥1 preference set):

```
┌─────────────────────────────────────────┐
│  RECOMMENDED FOR YOU       [refine →]   │
│  ╭─────╮ ╭─────╮ ╭─────╮                │
│  │card │ │card │ │card │  ← top 3, h-scroll on mobile
│  ╰─────╯ ╰─────╯ ╰─────╯                │
└─────────────────────────────────────────┘
ALL CAREER OPPORTUNITIES
[existing grid…]
```

- "refine →" deep-links to `/profile/edit#preferences`
- Empty preferences → one-line nudge card: *"Tell us what you're looking for to unlock recommendations"* + CTA. No broken empty state.
- Recommended cards = same `VacancyCard`, wrapped with a small reasons strip above.

---

## Phase B — 3-source aggregator pipeline + admin review queue

**Goal:** From ~5 manual posts/week to ~50 reviewed posts/week.

### Architecture

```
                ┌─────────────────────┐
  cron daily ─→ │ ingest-opportunities│  Edge function (scheduled)
                └──────────┬──────────┘
                           │ writes drafts
                           ▼
                  vacancy_review_queue (new table)
                           │
                           │ admin opens /admin/opportunities → "Review" tab
                           ▼
                  one-click Approve / Edit / Reject / Mark duplicate
                           │
                           ▼
                       vacancies
```

### New table: `vacancy_review_queue`

`id, source ('lawctopus'|'linkedin'|'careers_page'), source_url, source_firm, source_title, raw_text, ai_extracted jsonb (full vacancy fields incl. application_mode/url), status ('pending'|'approved'|'rejected'|'duplicate'), discovered_at, reviewed_by, reviewed_at, dedupe_hash`. RLS: opportunities_admin only.

`dedupe_hash = sha256(normalize(firm) + '|' + normalize(role))` — prevents re-queueing across runs and live vacancies.

### Source adapters (one edge fn `ingest-opportunities`)

Use **Firecrawl connector** (`standard_connectors--connect`).

1. **Lawctopus** — `firecrawl.map` on `https://www.lawctopus.com/internship-opportunities-and-jobs/`, take last 24h links, scrape each → markdown → run through `extract-vacancy` (which now handles email vs portal).
2. **LinkedIn Jobs** — `firecrawl.search` with `"legal counsel" OR "associate" India site:linkedin.com/jobs`, `tbs:'qdr:d'`. All become `application_mode='external_url'` with the LinkedIn URL.
3. **Top-30 firm careers pages** — `src/data/firm-careers-sources.ts` (name, careers URL, optional CSS hint). Weekly `firecrawl.crawl` `maxDepth:2, limit:20`. Diff against `dedupe_hash` set.

For each candidate: extract → compute `dedupe_hash` → insert into queue if hash not present in queue OR live `vacancies`.

### Admin Review tab

New tab in `/admin/opportunities` → **Review queue** (count badge):
- Card list: source pill, firm, role, deadline, "extracted from [source] · 3h ago", apply-mode badge.
- Row actions: **Quick approve** (publishes as-is), **Edit & approve** (opens `AdminVacancyDialog` pre-filled), **Reject** (with optional reason), **Mark duplicate** (links to existing vacancy id).
- Auto-flag: matching `dedupe_hash` against live → "Likely duplicate" badge.

### Cron

- Lawctopus + LinkedIn: daily 06:00 IST.
- Careers pages: weekly Sunday 02:00 IST.

---

## Files touched

**Phase A**
- migration: vacancies columns + enums + trigger + profile_applications.method enum
- `src/lib/vacancies.ts` — extend `Vacancy` type
- `src/lib/vacancy-dedupe.ts` — handle both modes
- `src/components/vacancies/AdminVacancyDialog.tsx` — radio + URL field + missing-link callout + tier + practice_area
- `src/components/vacancies/DuplicateBanner.tsx` — show URL-based dupes
- `src/components/vacancies/VacancyCard.tsx` — branching apply + tier pill
- `src/components/apply/DraftEmailDialog.tsx` — `cover_letter_only` mode
- `src/pages/Opportunities.tsx` — tier filter chip row
- `supabase/functions/extract-vacancy/index.ts` — extended schema + portal/tier/practice inference

**Phase C**
- migration: `profiles.target_tiers`, `profiles.target_locations`
- `src/lib/opportunity-ranker.ts` (new) + tests
- `src/pages/ProfileEdit.tsx` — Preferences section
- `src/pages/Opportunities.tsx` — Recommended-for-you section + reasons chips

**Phase B**
- migration: `vacancy_review_queue` + RLS
- `src/data/firm-careers-sources.ts` (new)
- `supabase/functions/ingest-opportunities/index.ts` (new) + cron
- `src/pages/AdminOpportunities.tsx` — Review queue tab
- `src/components/admin/opportunities/ReviewQueueTab.tsx` (new)
- Connect Firecrawl one-time

---

## Out of scope

- No follow-firms / push notifications (Model D dropped)
- No silent reorder — Recommended is visible
- No backfill of legacy 5 vacancies' tier — admin sets manually
- No Workday-vs-Greenhouse distinction in DB; the URL is the URL

## Sequence

A first (1 day) → manually add 5–10 Tier-1/Big-4 portal listings to validate → C (2 days) → B (3–5 days). Don't build personalisation against 5 listings.

Approve and I'll start with Phase A.
