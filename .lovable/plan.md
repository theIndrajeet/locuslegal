## Plan: make the live site reliably pick up new frontend builds

### What appears to be happening
The issue does not look like normal browser cache anymore.

Current evidence:
- `https://locus.legal/version.json` returns a live build version: `1777051659055`
- `https://locuslegal.lovable.app/version.json` returns the same version
- There is no service worker in the codebase, so this is not offline-cache behavior
- The app already polls `/version.json`, but that only helps an already-open tab detect a newer deployment

That points to one of these causes:
1. The newest frontend changes were not published yet, so the public domains are still serving the previous deployed build.
2. The live deployment is published, but the cache-busting strategy is too weak for some HTML/CDN paths.
3. The version-check logic is working only as an in-session refresh prompt, not as a true deployment freshness safeguard.

### Implementation
1. Verify the public build path is the right one
- Compare the current preview code against what is actually live on the published domain.
- Confirm whether this is a publish gap or a cache invalidation gap.

2. Harden build versioning
- Replace the current timestamp-only approach with a stronger deployment fingerprint tied to the actual build output.
- Ensure the version marker is emitted as part of the final production bundle in a way the host always serves.

3. Harden client refresh detection
- Keep `/version.json` polling, but make the refresh check more robust for custom domains and first-load cases.
- Add a stricter fetch strategy for the version file and guard against stale HTML holding old asset references.

4. Add a visible manual recovery path
- Add a small recovery action for production users when a stale build is detected, so they can force-load the newest release without relying on browser cache behavior.

5. Validate on all public entry points
- Check the published subdomain and custom domain behavior separately.
- Confirm that a fresh load shows the same build as the latest published version.

### Technical details
Files likely involved:
- `vite.config.ts` — build fingerprint generation
- `src/hooks/useVersionCheck.ts` — runtime stale-build detection
- `src/App.tsx` — refresh UX

Possible code changes:
- move version-file generation to a more reliable build hook
- include build metadata that matches the final deployed bundle
- strengthen the no-cache request path for version checks
- optionally append a deploy/version query param to recovery reloads

### Expected result
After this, opening the public site in Safari or Chrome should load the latest published frontend immediately, and already-open tabs should reliably prompt for refresh when a new deployment goes live.

Approve and I’ll implement the cache/deployment hardening and then tell you exactly whether the root cause was publish-state or stale asset delivery.