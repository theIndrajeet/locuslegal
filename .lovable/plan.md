# Watermark Everything: Built-In Viral Loop

Goal: every artifact a student copies, downloads, or shares should carry a clean Locus signature — never spammy, never blocking utility, always one tasteful line.

## Watermark Style Rules

- One line max. Never multi-line ASCII art.
- Plain text in plain-text outputs, HTML in HTML outputs.
- Never inserted into AI-generated copy that is meant to be sent to a recruiter unmodified (e.g. cold-email body) — instead it goes in the **clipboard wrapper** or **subject prefix**, never inside the body the recruiter reads. We don't want to sabotage the student's professional image.
- Variants by surface so it never feels like the same nag:
  - Documents: `— Generated with Locus · locus.legal/tools`
  - Clipboard: `\n\n— via Locus (locus.legal)`
  - Public links: `?ref=locus` UTM tag
  - Share-card images: small "locus.legal" corner mark

## Surfaces & Edits

### 1. Tools page — generated legal docs (NDA, DPA, internship, freelancer, ToS, checklist)
File: `src/pages/Tools.tsx` (`downloadOutput` line 430, `copyOutput` line 424)
- Append a footer line to the `.txt` blob:
  `\n\n────────────────────\nGenerated with Locus — Free Legal Tools\nhttps://locus.legal/tools\n`
- Same footer appended to clipboard copy. Safe here — these are template documents, not personal correspondence.

### 2. Application Tracker — drafted cold/follow-up emails
File: `src/components/apply/DraftEmailDialog.tsx` (`copyAll` line 465, `openInGmail` line 475)
- **Do NOT** modify `body` itself (recruiter-facing).
- For the "Copy email" button, append after the body:
  `\n\n---\nDrafted with Locus · locus.legal`
  This sits below the signature, student can delete it or leave it. Most will leave it.
- For Gmail open: leave the URL clean (recruiter sees nothing extra), but the clipboard fallback gets the watermark line.

### 3. CV Analyser — rewrite suggestions
File: `src/pages/CvAnalyser.tsx` (`FixCard.onCopy` line 339)
- Don't touch the rewrite text (goes into the CV).
- Instead, after copy, the toast already says "Rewrite copied" — add a one-time session toast: "Tip: share your fixed CV link with peers — `locus.legal/cv`" once per session.
- For the eventual CV PDF export (when added), reserve a footer slot: `Profile verified and formatted via locus.legal`.

### 4. Playbook EmailBlock — copyable email templates
File: `src/components/playbook/mdx/EmailBlock.tsx` (`handleCopy` line 17)
- Append `\n\n— Template via Locus Playbook · locus.legal/playbook` to the clipboard string.

### 5. Public Profile share
File: `src/pages/PublicProfile.tsx` (`handleShare` line 208)
- Add `?ref=share` UTM to the copied URL so we can attribute traffic.
- (Optional later: server-side OG image generation that stamps "locus.legal" on the share card.)

### 6. Bar Challenge — result share
File: `src/components/bar/ResultScreen.tsx`
- Add a "Share result" button next to the existing CTAs. Clicking copies:
  `I scored {points} on a {challenge_type} challenge at Locus — practice law for free at locus.legal/the-bar`
- Web Share API on mobile, clipboard fallback on desktop.

### 7. Vacancies — share a job
File: `src/components/vacancies/VacancyCard.tsx`
- Add a small share icon. Copies: `{role} at {firm} — via Locus · locus.legal/vacancies?ref=share`.

### 8. Directory — share a firm
File: `src/components/FirmDrawer.tsx`
- Add share button in drawer header. Copies a deep link `locus.legal/directory?firm={slug}&ref=share`.

### 9. Resources — downloaded templates
Files in `public/documents/*.docx, *.xlsx`
- These are static .docx/.xlsx files. Audit each: ensure footer reads `Locus · locus.legal/resources`. If missing, regenerate with the docx skill (one-time content task, not a code change). List which files actually need updating after inspection.

### 10. AI-drafted Bar challenge content / Tools output
Edge functions: `draft-application-email`, `draft-question-from-prompt`, generic AI calls
- No change to LLM prompts (output stays clean for end-user).
- Watermarking happens at the **client display layer** only, per surface above.

### 11. UTM tags on all internal share links
Add a tiny helper `src/lib/share.ts`:
```ts
export const withRef = (url: string, ref = "share") =>
  url + (url.includes("?") ? "&" : "?") + "ref=" + ref;
export const WATERMARK_TXT = "— via Locus · locus.legal";
export const WATERMARK_DOC = "\n\n────────────────────\nGenerated with Locus — Free Legal Tools\nhttps://locus.legal/tools\n";
```
All 9 surfaces above import from this single module so tone stays consistent and we can A/B test wording later from one place.

## What we explicitly do NOT watermark

- The body of cold emails to recruiters (kept clean — student's reputation).
- AI rewrites of CV bullet points (goes inside the CV).
- Form submissions, auth flows, anything backend-only.
- Admin dashboards.

## Out of scope (call out for follow-up)

- Server-rendered OG share cards with stamped logo (needs an Edge Function + image lib; bigger task).
- PDF export of CV with footer (CV PDF export doesn't exist yet).
- Email signature suggestion in profile setup ("Add 'locus.legal/u/{username}' to your email signature").

## Technical Details

- Single source of truth: `src/lib/share.ts` exports `WATERMARK_TXT`, `WATERMARK_DOC`, `withRef()`.
- No new dependencies.
- No DB changes.
- All edits are client-side; no edge function changes.
- Watermark wording is a constant — easy to tweak or kill globally.

## Estimated Footprint

~9 small edits across 9 files, plus 1 new helper file. Roughly 60 lines total.
