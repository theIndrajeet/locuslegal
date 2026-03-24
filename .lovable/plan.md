

## Add Uploaded Templates to Resources & Playbook

### Categorization

Based on file names and the existing page structure:

**Resources page** (student-facing downloadable templates — 6 new cards):
| File | Card Title |
|------|-----------|
| 02_Followup_Email_Template.docx | Follow-up Email Template |
| 03_ThankYou_Email_Template.docx | Thank You Email Template |
| 04_NOC_Request_Letter_Template.docx | NOC Request Letter Template |
| 05_Internship_Application_Tracker.xlsx | Internship Application Tracker |
| 06_Monthly_Internship_Log.docx | Monthly Internship Log |
| 07_LinkedIn_Profile_Checklist.docx | LinkedIn Profile Checklist |

**Playbook page** (firm-facing templates — attached as downloads to existing guides):
| File | Linked Guide |
|------|-------------|
| 16_Internship_Offer_Letter_Template.docx | LX-010: Building Your Firm's Internship Program |
| 17_Intern_NDA_Template.docx | LX-010: Building Your Firm's Internship Program |
| 18_Intern_Evaluation_Rubric.docx | LX-009: How to Evaluate a Law Intern |
| 19_Intern_Daily_Task_Sheet.docx | LX-009: How to Evaluate a Law Intern |

### Steps

**1. Process all files (exec)**
- Copy all 10 files to `public/documents/`
- Convert each DOCX/XLSX → PDF → JPEG preview images via LibreOffice + pdftoppm
- Name pattern: `followup-page-*.jpg`, `thankyou-page-*.jpg`, etc.

**2. Update `src/pages/Resources.tsx`**
- Add 6 new resource cards with Download + Preview support (same pattern as existing CV and Cold Email cards)
- Each card gets appropriate icon, title, description, download link, and preview images
- Reorder: CV Analyser and Book Your Session (coming soon) move to the end

**3. Update `src/pages/Playbook.tsx`**
- Add optional `attachments` array to the `Guide` interface: `{ label: string; href: string }[]`
- Add attachments to LX-009 (Evaluation Rubric + Daily Task Sheet) and LX-010 (Offer Letter + NDA)
- In the guide detail view, render an "Attachments" section with download buttons below the "What's inside" section

### Files

| Action | File |
|--------|------|
| Create | `public/documents/` — 10 template files + their preview images |
| Edit | `src/pages/Resources.tsx` — add 6 new downloadable resource cards |
| Edit | `src/pages/Playbook.tsx` — add attachments field to Guide, attach 4 firm templates to relevant guides |

