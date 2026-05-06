# Phase B (Narrowed): Firm Careers Aggregator

You're right on both counts. **LinkedIn is a legal/contractual landmine** (hiQ ruling, explicit ToS prohibition, aggressive anti-bot) and **Lawctopus is WAF-gated with unclear ToS** — both are scrape-at-your-own-risk and would put Locus on shaky ground from day one. Firm careers pages are the cleanest source: public, employer-published, intended to be discovered, and authoritative.

## Scope

- **~50 curated firm careers URLs** (Tier 1 + Tier 2 + select boutiques)
- **Weekly cron** (Sunday 02:00 IST) — well within Firecrawl free tier (~200 scrapes/week)
- **Every result lands in `vacancy_review_queue`** as `pending` — admin must approve before it goes live
- **No auto-promotion.** No LinkedIn. No Lawctopus.

## Authenticity safeguards

This addresses your earlier "vague/unauthentic" concern directly:

1. **Source-of-truth link preserved** — every queued row keeps `source_url` pointing to the firm's own careers page. Listings will show "Source: AZB careers page" with a click-through.
2. **Human-in-the-loop** — admin reviews AI-extracted fields against the scraped raw_text before promotion. Nothing goes live unscreened.
3. **Conservative AI extraction** — Gemini 2.5 Flash extracts only fields it can quote verbatim from the page; missing fields stay `null` rather than being inferred.
4. **"Verified" badge** for admin-approved aggregated listings; manually-posted firm vacancies get a separate "Direct from firm" badge. Users can tell the difference.
5. **Stale detection** — if a URL stops returning the listing on the next weekly run, mark the live vacancy as `expired` automatically.

## Build steps

### 1. Curate the firm careers URL list
- New table `firm_careers_sources` (firm_id FK, url, selector_hints jsonb, last_scraped_at, active)
- Seed migration with ~50 URLs from existing `firms` table (Tier 1 + 2)
- Admin UI at `/admin/opportunities/sources` to add/edit/disable URLs

### 2. Firecrawl integration
- Connect Firecrawl via `standard_connectors--connect` (you already have the key — connector flow links it cleanly so it's managed going forward)
- Edge function `scrape-firm-careers` — takes a source row, calls Firecrawl `/scrape` with `formats: ['markdown', 'links']`, `onlyMainContent: true`
- Stores raw markdown in `vacancy_review_queue.raw_text`

### 3. AI extraction pass
- Edge function `extract-from-scrape` — feeds markdown to Gemini 2.5 Flash with strict schema (title, role_type, location, deadline, apply_url, description)
- Prompt instruction: "Only extract fields explicitly present in the source. Return null for anything you'd have to guess."
- Result stored in `vacancy_review_queue.ai_extracted` (jsonb)

### 4. Dedupe
- Compute `dedupe_hash` from normalized `firm_id + title + location` 
- Cross-check against (a) existing live `vacancies`, (b) other pending queue rows
- Mark `status='duplicate'` and set `duplicate_of` instead of creating a second row

### 5. Weekly cron orchestrator
- Edge function `cron-scrape-careers` — iterates active sources with concurrency=3, 2s delay, calls scrape + extract for each
- pg_cron schedule: `0 20 * * 6` (Sat 20:00 UTC = Sun 01:30 IST)
- Logs per-source success/failure to `vacancy_review_queue.notes` for debugging

### 6. Admin Review Queue UI
- New tab in `/admin/opportunities` → "Review Queue"
- Table: source firm, scraped title, discovered_at, status badge
- Row click opens drawer: side-by-side raw_text + ai_extracted form (editable)
- Actions: **Approve & Promote** (creates row in `vacancies` linked back via `promoted_vacancy_id`), **Reject** (with reason), **Mark duplicate**
- Bulk approve for obviously-clean rows

### 7. Stale auto-expiry
- Weekly cron also re-scrapes URLs of currently-live aggregated vacancies
- If listing no longer present in scrape → set `status='expired'`, notify admin

## What we're NOT building

- ~~Lawctopus scraper~~ — Cloudflare-gated, ToS-unclear
- ~~LinkedIn jobs scraper~~ — explicit ToS violation, legal risk
- ~~Auto-promotion~~ — every listing gets eyeballs before going live
- ~~Daily cron~~ — weekly is plenty for firm careers (they don't post that often)

## Effort estimate

- ~5–6 build steps across ~3 messages (vs. the original 8–10 for the full 3-source pipeline)
- Firecrawl free tier covers it indefinitely at this volume
- The `vacancy_review_queue` table is already migrated from the previous step — reusable as-is

## Technical notes

- All scraping/extraction in edge functions (server-side only, `FIRECRAWL_API_KEY` never exposed)
- pg_cron + pg_net for the weekly trigger (Lovable Cloud has both)
- Rate limit: max 3 concurrent Firecrawl requests, 2s spacing — well under their burst limits
- Idempotent: `source_url` is unique in `vacancy_review_queue`, so a re-scrape of an already-queued URL is a no-op until reviewed

Approve and I'll start with the Firecrawl connector wiring + the `firm_careers_sources` table + seed migration.
