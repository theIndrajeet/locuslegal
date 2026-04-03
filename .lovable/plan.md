

## SEO Audit Report for Locus

### What's Good
- Title tag, meta description, and OG/Twitter cards are properly set on the homepage
- robots.txt correctly configured with sitemap reference
- sitemap.xml lists all public pages
- Canonical URL set to `https://locus.legal/`
- JSON-LD Organization schema present
- Favicon and apple-touch-icon configured
- Font preconnect hints in place
- `lang="en"` on `<html>`

### Issues Found

**Critical**
1. **No per-page `<title>` or `<meta description>`** — Only the Playbook page sets `document.title`. All other pages (Directory, Resources, Tools, The Bar, Auth, etc.) use the same homepage title. This hurts ranking for every subpage.
2. **SPA with no SSR/prerendering** — Search engines that don't execute JS will see an empty `<div id="root">`. Google handles this okay-ish, but Bing, social crawlers, and link previews won't get page-specific content.

**Moderate**
3. **Sitemap missing `<lastmod>` and `<changefreq>`** — Makes it harder for crawlers to prioritize fresh content.
4. **No `<h1>` on several pages** — Directory, Tools, and The Bar pages may lack a clear semantic `<h1>` heading.
5. **Images without `alt` text** — Only Resources page images have `alt`. Any other images (display cards, icons used decoratively) should have `alt=""` for accessibility or descriptive alt for meaningful images.
6. **Canonical URL is hardcoded to `/`** — Every route returns `<link rel="canonical" href="https://locus.legal/">` instead of its own URL.
7. **OG URL hardcoded to `/`** — Same problem as canonical; social shares from subpages show the wrong URL.

**Minor**
8. **`sameAs` array is empty** in JSON-LD — Add social profile URLs when available.
9. **apple-touch-icon uses SVG** — iOS doesn't support SVG for apple-touch-icon; should be a PNG.
10. **No `<meta name="keywords">`** — Low impact but easy to add for niche legal terms.

---

### Proposed Fix Plan

**Files to change:**

1. **New: `src/hooks/usePageMeta.ts`** — A reusable hook that sets `document.title`, and dynamically updates `<meta name="description">`, canonical URL, and OG tags per route.

2. **Edit: All page components** (Directory, Resources, Tools, TheBar, Auth, ProfileEdit) — Call `usePageMeta({ title: "...", description: "..." })` at the top of each page.

3. **Edit: `index.html`** — Remove hardcoded canonical/OG URL (the hook will manage them dynamically). Keep defaults as fallbacks.

4. **Edit: `public/sitemap.xml`** — Add `<lastmod>` dates and `<changefreq>` values.

5. **Generate: `public/apple-touch-icon.png`** — Convert favicon to a 180x180 PNG. Update `index.html` reference.

This is a code-only fix — no database changes needed. Each page will get its own unique title, description, and canonical URL for proper indexing and social sharing.

