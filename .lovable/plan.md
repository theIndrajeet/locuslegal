

# Replace All Buttons with Neobrutalist Button Component

## What Changes

Replace the current `InteractiveHoverButton` with a neobrutalist `Button` component that has bold borders, box shadows, and a translate-on-hover effect. Adapt the provided component's color system to work with the existing Black/White/Yellow theme.

## Color Mapping

The provided component uses its own CSS variables (`--main`, `--bw`, etc.). We'll map these to the existing yellow/black/white palette:

| Neobrutalist var | Light mode | Dark mode |
|---|---|---|
| `--main` | `hsl(45, 100%, 51%)` (yellow) | `hsl(45, 100%, 51%)` |
| `--bg` | `#ffffff` | `#080808` |
| `--bw` | `#ffffff` | `#212121` |
| `--blank` | `#000` | `#fff` |
| `--border` | `#000` | `#fafafa` |
| `--text` | `#000` | `#fafafa` |
| `--mtext` | `#000` | `#000` |

## Steps

### 1. Update `tailwind.config.ts`
Add the neobrutalist extensions: `colors` (main, bw, blank, text, mtext, border overrides), `borderRadius.base`, `boxShadow.shadow`, `translate` (boxShadowX/Y, reverseBoxShadowX/Y), `fontWeight` (base, heading).

### 2. Update `src/index.css`
Add the neobrutalist CSS variables (`--main`, `--bw`, `--blank`, `--border`, `--text`, `--mtext`, `--shadow`, etc.) to both `:root` and `.dark`, using the yellow/black/white palette.

### 3. Replace `src/components/ui/button.tsx`
Swap with the neobrutalist button component (keeps `asChild`, variants: `default`, `noShadow`, `neutral`, `reverse`).

### 4. Update all 4 component files to use new `Button`
- **Hero.tsx** — Replace 2 `InteractiveHoverButton` instances with `<Button>` wrapped in `<a>` tags. Primary CTA gets `variant="default"`, secondary gets `variant="neutral"`.
- **ForStudents.tsx** — Replace 1 `InteractiveHoverButton` with `<Button>`.
- **ForFirms.tsx** — Replace 1 `InteractiveHoverButton` with `<Button variant="reverse">`.
- **WaitlistSection.tsx** — Replace 2 `InteractiveHoverButton` submit buttons with `<Button type="submit">`.

### 5. Optionally delete `interactive-hover-button.tsx`
No longer used after replacements.

## Files Changed
- **Edit:** `tailwind.config.ts` — add neobrutalist theme extensions
- **Edit:** `src/index.css` — add CSS variables for neobrutalist colors
- **Replace:** `src/components/ui/button.tsx` — neobrutalist button
- **Edit:** `src/components/Hero.tsx` — swap to `Button`
- **Edit:** `src/components/ForStudents.tsx` — swap to `Button`
- **Edit:** `src/components/ForFirms.tsx` — swap to `Button`
- **Edit:** `src/components/WaitlistSection.tsx` — swap to `Button`
- **Delete:** `src/components/ui/interactive-hover-button.tsx`

