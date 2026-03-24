

## Replace Cover Letter Template Card with Download + Preview

### What
Add the same dual-action (Download + Preview) treatment to the Cover Letter Template card, using the uploaded `01_Cold_Email_Template.docx` file. Convert it to images for the preview modal.

### Steps

**1. File processing (exec)**
- Copy `user-uploads://01_Cold_Email_Template.docx` to `public/documents/CoverLetterTemplate.docx`
- Convert DOCX → PDF via LibreOffice, then PDF → JPEG pages via `pdftoppm`
- Store images as `public/documents/cl-page-*.jpg`

**2. Update `src/pages/Resources.tsx`**
- Change the Cover Letter card to `hasPreview: true` and add a `previewKey` field to distinguish it from the CV
- Add a second `previewOpen` state (or refactor to track which resource is being previewed, e.g. `previewResource: string | null`)
- When previewing Cover Letter, show the `cl-page-*.jpg` images in the same Dialog pattern
- Download link points to `/documents/CoverLetterTemplate.docx`

### Files

| Action | File |
|--------|------|
| Create | `public/documents/CoverLetterTemplate.docx` |
| Generate | `public/documents/CoverLetterTemplate.pdf` + `cl-page-*.jpg` |
| Edit | `src/pages/Resources.tsx` — refactor preview state, add Cover Letter preview |

