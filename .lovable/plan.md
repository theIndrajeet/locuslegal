

# SEO, Meta Tags, and Favicon Overhaul

## Summary

Complete SEO and branding update: generate an SVG favicon with the Locus brand mark, add all missing meta tags (canonical, sitemap, structured data, theme-color), and clean up existing OG/Twitter tags.

## Changes

### Create `public/favicon.svg`
- SVG favicon: a bold "L" lettermark in the accent color on a dark rounded-square background
- Matches the Locus brand identity

### Edit `index.html`
- Replace `favicon.ico` reference with `favicon.svg`
- Add `<link rel="icon">` and `<link rel="apple-touch-icon">` pointing to the SVG
- Add `<meta name="theme-color" content="#1a1a2e">` (dark theme) for browser chrome styling
- Add `<link rel="canonical" href="https://locus.legal/">` 
- Add `<meta property="og:url" content="https://locus.legal/">`
- Add `<meta property="og:site_name" content="Locus">`
- Add `<meta name="robots" content="index, follow">`
- Add structured data (`application/ld+json`) for Organization schema with name, url, description
- Keep existing OG/Twitter title, description, and image tags (they're good)

### Create `public/sitemap.xml`
- List all public routes: `/`, `/directory`, `/playbook`, `/resources`, `/tools`, `/the-bar`
- Reference `https://locus.legal` as the base URL

### Edit `public/robots.txt`
- Add `Sitemap: https://locus.legal/sitemap.xml` line

## Files

| Action | File |
|--------|------|
| Create | `public/favicon.svg` |
| Create | `public/sitemap.xml` |
| Edit   | `index.html` |
| Edit   | `public/robots.txt` |

