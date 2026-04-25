## Problem

At 390px (mobile), the IdentityRow squeezes 4 elements into one row:
`[Avatar] [Name + @handle] [● OPEN pill] [VIEW PUBLIC PROFILE ↗]`

Result: the row wraps, the OPEN pill ends up on a second line next to a stranded "VIEW PUBLIC PROFILE" link, and the name gets truncated to "ad…". It looks broken.

## Fix

In `src/components/app/IdentityRow.tsx`:

1. **Collapse "View public profile" to an icon-only button on mobile** — show just the `ExternalLink` icon (with `aria-label` + `title="View public profile"` for a11y). Expand to the full text label only at `sm:` and above.
2. **Add `shrink-0`** to the avatar, OPEN pill, and profile-link button so they never get squeezed.
3. **Remove `flex-wrap`** from the row — with the icon-only profile link, everything fits cleanly on one line at 390px without wrapping.
4. **Keep the name block as `flex-1 min-w-0 truncate`** so the name is the only element that gracefully truncates if the display name is very long.

Net effect at 390px: `[AV] [adminmadam @adminmadam] [● OPEN] [↗]` — single line, no truncation of the username, OPEN pill stays inline.

No other files affected. No design-system or behavior changes.