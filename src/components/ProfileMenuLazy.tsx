/**
 * ProfileMenuLazy — paints a static avatar button instantly (zero JS deps),
 * then swaps in the real ProfileMenu (which pulls supabase + sonner) only on
 * first interaction or once the page goes idle.
 *
 * Keeps the supabase chunk OUT of the home page's critical render path.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { UserCircle } from "lucide-react";

const ProfileMenu = lazy(() => import("./ProfileMenu"));

export default function ProfileMenuLazy() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    let cancelled = false;
    const load = () => {
      if (!cancelled) setShouldLoad(true);
    };

    // Idle fallback — load after the page settles even if the user does nothing.
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    let idleId: number | null = null;
    let timerId: number | null = null;
    if (ric) {
      idleId = ric(load, { timeout: 4000 });
    } else {
      timerId = window.setTimeout(load, 2500);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [shouldLoad]);

  if (shouldLoad) {
    return (
      <Suspense
        fallback={
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Profile menu"
          >
            <UserCircle size={20} className="text-muted-foreground" />
          </button>
        }
      >
        <ProfileMenu />
      </Suspense>
    );
  }

  // Static placeholder — clicking it triggers the real menu to load,
  // and the click event will bubble through Suspense once mounted.
  return (
    <button
      className="p-2 rounded-full hover:bg-muted/50 transition-colors"
      aria-label="Profile menu"
      onPointerDown={() => setShouldLoad(true)}
      onFocus={() => setShouldLoad(true)}
    >
      <UserCircle size={20} className="text-muted-foreground" />
    </button>
  );
}
