import { useEffect, useRef } from "react";

/**
 * Polls /version.json and fires `onUpdateAvailable` exactly once when the
 * deployed build version differs from the version baked into this bundle.
 *
 * - Skipped in dev (HMR makes it pointless and noisy).
 * - Skipped inside iframes / Lovable preview hosts (avoids spamming editors).
 * - Polls every `intervalMs` and on window focus.
 */
export function useVersionCheck(
  onUpdateAvailable: () => void,
  intervalMs: number = 60_000
) {
  const firedRef = useRef(false);
  const callbackRef = useRef(onUpdateAvailable);
  callbackRef.current = onUpdateAvailable;

  useEffect(() => {
    if (import.meta.env.DEV) return;

    // Skip inside iframes (Lovable preview, embeds, etc.)
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    if (inIframe) return;

    const host = window.location.hostname;
    if (
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host.includes("lovable.app")
    ) {
      // Avoid prompting refresh on Lovable-hosted preview/staging domains.
      // Production custom domains (locus.legal) will still get the check.
      return;
    }

    const currentVersion =
      typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : null;
    if (!currentVersion) return;

    const check = async () => {
      if (firedRef.current) return;
      try {
        const res = await fetch(`/version.json?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (data?.version && data.version !== currentVersion) {
          firedRef.current = true;
          callbackRef.current();
        }
      } catch {
        // Network blip — try again next tick.
      }
    };

    // First check after a short delay so we don't race app startup.
    const initial = window.setTimeout(check, 5_000);
    const interval = window.setInterval(check, intervalMs);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);
}
