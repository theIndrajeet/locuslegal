

# Simplify "Read Guide" to PDF Viewer

## Problem

Currently, "Read Guide" renders all the guide content as typed-out text in the page. You want it to simply open a PDF preview dialog (like the Resources page does) showing the uploaded PDF pages as images.

## Plan

### 1. Generate preview images from the 5 LX PDFs

Convert each PDF (`LX-001-ColdEmail.pdf` through `LX-005-ConvertPPO.pdf`) to page images using `pdftoppm`. These will be saved as `LX-001-ColdEmail-page-1.jpg`, `LX-001-ColdEmail-page-2.jpg`, etc.

### 2. Replace reader mode with PDF preview dialog

Remove the inline reader mode (the typed-out content view) from `GuideDetail`. Instead, add a `Dialog` component (same pattern as Resources page) that opens when "Read Guide" is clicked. The dialog shows the PDF page images in a scrollable container.

### 3. Add preview metadata to guide data

Add `previewPages` and `previewPrefix` fields to each guide (LX-001 through LX-005) so the dialog knows how many pages to render and where to find the images.

### 4. Remove typed content

Remove the large `guideContent` object with all the typed-out section text — no longer needed since the PDFs themselves serve as the content.

### Files Changed

| Action | File |
|--------|------|
| Create | `public/documents/LX-001-ColdEmail-page-*.jpg` through `LX-005-ConvertPPO-page-*.jpg` (preview images) |
| Edit | `src/pages/Playbook.tsx` — replace reader mode with PDF preview dialog, remove `guideContent`, add preview metadata |

