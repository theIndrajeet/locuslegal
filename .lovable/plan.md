

# Build Reader and Download for LX-001 to LX-005

## What We're Building

Enable the "Read Guide" and "Download PDF" buttons for LX-001 through LX-005 with full written content. LX-006 to LX-014 stay as "Coming Soon." Also add relevant attachments to each of these 5 guides.

## Plan

### 1. Write Full Guide Content (LX-001 to LX-005)

Add a `content` field to the Guide interface — an array of `{ heading: string; body: string }` objects matching each guide's sections. Each section will have 2-3 paragraphs of practical, actionable content tailored to Indian law students.

| Guide | Topic | Sections |
|-------|-------|----------|
| LX-001 | Cold emailing law firms | Why emails fail, finding contacts, subject lines, email structure, following up |
| LX-002 | Non-NLU students getting top internships | Reframing disadvantage, what firms want, portfolio, direct apps, persistence |
| LX-003 | First legal internship expectations | Day one, types of work, asking questions, tracking work, exit checklist |
| LX-004 | Writing a legal research memo | What a memo is, IRAC, research methodology, style/tone, common mistakes |
| LX-005 | Converting internship to PPO | What firms want, visibility, feedback, follow-up timeline, PPO request |

### 2. Build the Reader View

When "Read Guide" is clicked for LX-001-005:
- Toggle the guide detail into a full reading mode showing all section content
- Each section renders as a heading + body text with clean typography
- Add a "Back to overview" button to return to the section list view
- Smooth transition between overview and reader

### 3. Generate Downloadable PDFs

Create 5 PDF files using a script (reportlab or docx-js → LibreOffice):
- Professional formatting with Locus branding (dark header, gold accents)
- Cover page with guide title, case number, audience, read time
- All 5 sections with headings and body content
- Output to `public/documents/` as `LX-001-ColdEmail.pdf`, etc.

### 4. Add Attachments to LX-001 through LX-005

Using existing uploaded templates:

| Guide | Attachments |
|-------|-------------|
| LX-001 | Cold Email Template (cross-link from Resources), Follow-up Email Template |
| LX-002 | Internship Application Tracker, LinkedIn Profile Checklist |
| LX-003 | Monthly Internship Log, First Day Checklist (Coming Soon) |
| LX-004 | Legal Research Memo Template (Coming Soon), Sample IRAC Memo (Coming Soon) |
| LX-005 | Thank You Email Template, NOC Request Letter Template |

### 5. Conditional Button States

In `GuideDetail`, check if guide has content:
- **LX-001 to LX-005**: "Read Guide" and "Download PDF" buttons are active and functional
- **LX-006 to LX-014**: Buttons remain disabled with "Coming Soon" label

### Files Changed

| Action | File |
|--------|------|
| Edit | `src/pages/Playbook.tsx` — add content field, reader view, attachments, conditional buttons |
| Create | `public/documents/LX-001-ColdEmail.pdf` through `LX-005-ConvertPPO.pdf` — downloadable guide PDFs |

