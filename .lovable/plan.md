

# Replace All Buttons with InteractiveHoverButton

## What Changes

Create the `InteractiveHoverButton` component and replace all CTA buttons/links across the landing page with it. The component has a hover effect that slides in a dark overlay with an arrow icon.

## Buttons to Replace (6 total)

| Location | Current Text | Type |
|---|---|---|
| Hero | "I'm a Student" | `<a>` link |
| Hero | "I'm a Firm" | `<a>` link |
| ForStudents | "Join as a Student" | `<a>` link |
| ForFirms | "List Your Firm" | `<a>` link |
| WaitlistSection | "I want an internship" | `<button>` submit |
| WaitlistSection | "I want pre-screened interns" | `<button>` submit |

## Files

- **New:** `src/components/ui/interactive-hover-button.tsx` — the component as provided, adapted (already has all deps: `lucide-react`, `cn`)
- **Edit:** `src/components/Hero.tsx` — replace both `<a>` CTAs with `InteractiveHoverButton` wrapped in `<a>` tags
- **Edit:** `src/components/ForStudents.tsx` — replace CTA link
- **Edit:** `src/components/ForFirms.tsx` — replace CTA link
- **Edit:** `src/components/WaitlistSection.tsx` — replace both submit buttons (keeping `type="submit"`)

## Notes
- No new dependencies needed (`lucide-react` and `cn` already installed)
- For `<a>` links, wrap the button or use `onClick` with scroll behavior
- For form submits, pass `type="submit"` as a prop
- Will adapt sizing/colors per context (accent bg for primary CTAs, outline style for secondary)

