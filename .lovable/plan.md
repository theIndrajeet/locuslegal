

## Make Demo CV Downloadable & Viewable

### What
Copy the uploaded DOCX file into the project and update the Demo CV card to offer two actions: **Download** (saves the file) and **Preview** (opens an in-page modal showing a rendered preview of the CV).

### Approach
Since browsers can't natively render DOCX files, the best approach is:
1. Convert the DOCX to a PDF for preview (using a script at build time), then show the PDF in an iframe/embed inside a Dialog modal
2. Keep the original DOCX available for download

However, since we can't run server-side conversions in this client-side app, the pragmatic approach is:
- **Convert the DOCX → PDF now** (one-time, during this session) and store both files in `public/`
- **Download button** → links to the `.docx` file
- **Preview button** → opens a Dialog/modal with the PDF embedded via `<iframe>` or `<embed>`

### Changes

**One-time conversion** (exec step)
- Parse the uploaded DOCX, convert to PDF using LibreOffice, copy both files to `public/documents/`

**`src/pages/Resources.tsx`**
- Import `Dialog` from `src/components/ui/dialog.tsx`
- Add `Eye` icon from lucide-react
- For the Demo CV card, replace the single button with two buttons side by side:
  - **Download** — an `<a>` tag with `href="/documents/IdealCVTemplate.docx"` and `download` attribute
  - **Preview** — opens a Dialog containing an `<embed src="/documents/IdealCVTemplate.pdf" type="application/pdf">` for full-page PDF viewing
- Dialog styled to be large (max-w-4xl, h-[80vh]) for comfortable reading

**Files**
| Action | File |
|--------|------|
| Copy | `public/documents/IdealCVTemplate.docx` |
| Generate | `public/documents/IdealCVTemplate.pdf` |
| Edit | `src/pages/Resources.tsx` |

