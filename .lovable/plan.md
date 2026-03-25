

# Top Scrollable Nav Strip — But Make It Cool

## Summary

Replace the hamburger with an always-visible horizontal nav strip below the logo bar on mobile. But instead of boring plain text links, we'll make it **on-brand neobrutalist** with personality.

## Design Details

- **Each link is a mini pill/chip** with a thick neobrutalist border (`border-2 border-black dark:border-white`), small shadow (`shadow-[2px_2px_0_0_#000]`), rounded corners
- **Active link**: filled accent/yellow background with dark text — pops immediately
- **Inactive links**: transparent bg, muted text, on tap/hover they get a micro bounce
- **Tools chip**: has the pulse dot inside the pill
- **The Bar chip**: keeps glitch text effect
- **Scroll behavior**: `overflow-x-auto`, hide scrollbar, horizontal snap — the strip is swipeable, with a subtle gradient fade on the right edge to hint "there's more"
- **Sticky**: scrolls with the navbar, always accessible
- **Spacing**: `gap-2 px-4 py-2`, compact but tactile

```text
┌──────────────────────────────────────┐
│  Locus                          ☀️   │
│──────────────────────────────────────│
│  [Home] [Directory] [Playbook] [R→   │  ← neobrutalist pill chips
└──────────────────────────────────────┘
```

The chips give it a tactile, app-like, design-forward feel — not a boring nav bar.

## Changes

### `src/components/Navbar.tsx`
- Remove `open` state, `Menu`/`X` imports, hamburger button, mobile dropdown
- Add a `md:hidden` scrollable row inside the sticky `<nav>` after the logo bar
- Each link rendered as a pill chip with neobrutalist styling
- Active = accent bg + shadow; inactive = outlined
- Right-edge fade gradient overlay to hint at scrollability

### `src/index.css`
- Add `.scrollbar-hide` utility (`::-webkit-scrollbar { display: none }`)

## Files

| Action | File |
|--------|------|
| Edit | `src/components/Navbar.tsx` |
| Edit | `src/index.css` |

