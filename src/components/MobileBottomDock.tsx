import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Building2, BookOpen, Library, Wrench, Gavel } from "lucide-react";
import { prefetchRoute } from "@/lib/prefetch";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/directory", icon: Building2, label: "Directory" },
  { to: "/playbook", icon: BookOpen, label: "Playbook" },
  { to: "/resources", icon: Library, label: "Resources" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/the-bar", icon: Gavel, label: "The Bar" },
];

export default function MobileBottomDock() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [hasCompareBar, setHasCompareBar] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Watch for the CompareBar mounting/unmounting so the dock can yield to it
  // on mobile (both are fixed-bottom elements that would otherwise overlap).
  useEffect(() => {
    const check = () => setHasCompareBar(!!document.querySelector('[data-compare-bar="true"]'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // When CompareBar is visible, hide the dock entirely on mobile — the
  // CompareBar's own actions take priority on the directory page.
  if (hasCompareBar) return null;

  return (
    <nav className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden transition-all duration-700 ease-in-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-background/60 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/10">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              onTouchStart={() => prefetchRoute(to)}
              onMouseEnter={() => prefetchRoute(to)}
              className="relative w-10 h-10 flex items-center justify-center transition-transform duration-150 active:scale-90"
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={
                  isActive
                    ? "text-accent drop-shadow-[0_0_6px_hsl(var(--accent)/0.5)]"
                    : "text-muted-foreground"
                }
              />
              {isActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
