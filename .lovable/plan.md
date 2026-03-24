

# Create Tools Page with AI-Powered Legal Document Generation

## Summary

Build the `/tools` page (4 legal document generators) using Lovable AI via a Supabase edge function. The original HTML called Anthropic directly from the browser — we'll route through Lovable Cloud instead, which already has `LOVABLE_API_KEY` available.

## Architecture

```text
Tools Page (React) → Edge Function (chat-legal) → Lovable AI Gateway → Response
```

## Changes

### 1. Enable Lovable Cloud
Set up Supabase/Lovable Cloud to get edge functions working.

### 2. Create Edge Function: `supabase/functions/chat-legal/index.ts`
- Accepts tool-specific prompts from the client
- Adds the legal system prompt (senior legal drafter with expertise in Indian law, GDPR, APAC)
- Calls Lovable AI Gateway (non-streaming, since we render full documents)
- Returns generated text
- Handles 429/402 errors

### 3. Add Google Fonts to `index.html`
- Add `Cormorant Garamond`, `DM Sans`, `DM Mono` for the tools page's distinct look

### 4. Create `src/pages/Tools.tsx`
Full React port of all 4 tools with the navy/gold theme:
- **Tab system**: NDA Generator, Data Protection Checklist, DPA Template, Internship Agreement
- **Form panels**: All inputs/selects/textareas from the HTML, using React controlled state
- **Output panels**: Placeholder → Loading spinner → Rendered document
- **Checklist tool**: Interactive checkboxes with progress bar
- **Copy/Download**: Working clipboard and .txt download
- **All CSS**: Scoped `<style>` block with the distinct color palette (`--bg: #08080e`, `--gold: #c9a84c`, Cormorant Garamond headings, DM Mono labels)
- **AI calls**: Invoke the edge function with the same prompts from the HTML
- **Responsive**: Single column on mobile

### 5. Add route in `src/App.tsx`
- `<Route path="/tools" element={<Tools />} />`

### 6. Add nav link in `src/components/Navbar.tsx`
- Add "Tools" to the `navLinks` array

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/chat-legal/index.ts` |
| Edit | `index.html` — add font imports |
| Create | `src/pages/Tools.tsx` |
| Edit | `src/App.tsx` — add route |
| Edit | `src/components/Navbar.tsx` — add nav link |

