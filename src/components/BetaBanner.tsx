import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "locus_beta_banner_dismissed_v1";

export default function BetaBanner() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;
  if (pathname.startsWith("/beta")) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  return (
    <div className="relative z-[60] w-full bg-black border-b-2 border-accent text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="shrink-0 rounded-sm border-2 border-accent bg-accent px-1.5 py-0.5 font-sora text-[10px] font-black uppercase tracking-wider text-black">
            Beta
          </span>
          <p className="min-w-0 truncate font-inter">
            <span className="hidden sm:inline">Locus is in active beta — actively rolling out. </span>
            <span className="sm:hidden">Active beta. </span>
            Spotted a bug?{" "}
            <Link
              to="/beta"
              className="inline-flex items-center gap-1 font-semibold text-accent underline-offset-2 hover:underline"
            >
              Tell us <ArrowRight size={12} />
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss beta banner"
          className="shrink-0 rounded-sm p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
