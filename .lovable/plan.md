

# Rebrand to "Locus" Everywhere, Keep "Locus by LexRoot" Only in Footer

## What Changes

Remove "by LexRoot" from all locations except the footer. The footer keeps the full branding with copyright.

## Changes

### 1. Navbar (`src/components/Navbar.tsx`)
- Remove the `<span>by LexRoot</span>` line beneath the logo. Just show "Locus" with accent-colored "us".

### 2. Footer (`src/components/Footer.tsx`)
- Keep "Locus by LexRoot" in the logo area
- Keep copyright line: `© 2026 Locus by LexRoot. All rights reserved.`
- Remove the tagline "Your merit. Your internship." from the logo block (it's redundant here) — or keep it if you prefer. Your call.

### 3. Playbook page title (`src/pages/Playbook.tsx`)
- Change `document.title` from `"The Locus Playbook — Guides & Resources | Locus by LexRoot"` to `"The Locus Playbook — Guides & Resources | Locus"`

### 4. HTML meta tags (`index.html`)
- `<title>`: "Locus — Merit-Based Legal Internships in India"
- `og:title` / `twitter:title`: same
- `meta author`: "Locus"

### Files Changed

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Remove "by LexRoot" subtitle |
| `src/components/Footer.tsx` | Keep as-is (only place with full branding) |
| `src/pages/Playbook.tsx` | Update page title |
| `index.html` | Update title and meta tags |

