

# Keep Glitch Animation Always Active on "The Bar" Nav Link

## Summary
The glitch chromatic aberration animation on "The Bar" navbar link currently only triggers on hover. Change the CSS so it's always animating.

## Changes

### Edit `src/index.css`
- Move the `opacity` and `animation` properties from `.glitch-link:hover::before` / `.glitch-link:hover::after` into the base `.glitch-link::before` / `.glitch-link::after` rules
- Remove the hover-only rules (or keep them identical for no-op)

This makes the pseudo-elements always visible and animating, not just on hover.

