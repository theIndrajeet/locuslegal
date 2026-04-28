## Beta banner only (skipping dock fix per your call)

### What ships

**New file:** `src/components/BetaBanner.tsx`
- Slim top bar (~36px), neobrutalist: black bg, yellow accent border-bottom
- Yellow "BETA" pill (Sora, black text) + message: *"Locus is in active beta — actively rolling out. Spotted a bug? Tell us →"*
- Mobile collapses to: *"Active beta. Spotted a bug? Tell us →"*
- Lucide `X` to dismiss; persists in `localStorage` (`locus_beta_banner_dismissed_v1`)
- Auto-hides on `/beta` itself (don't preach to the choir)
- Starts hidden on first paint to avoid flash; reveals after localStorage check

**Edit:** `src/components/Layout.tsx`
- Mount `<BetaBanner />` as first child, above `<Navbar />` — sits in normal flow, navbar continues to be `sticky top-0` below it

### Out of scope
- MobileBottomDock — leaving alone per your instruction.

Approve and I ship.