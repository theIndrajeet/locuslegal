import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Home,
  Building2,
  BookOpen,
  Library,
  Wrench,
  Gavel,
  Search,
  Send,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { prefetchRoute } from "@/lib/prefetch";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type NavItem = { to: string; label: string; icon: LucideIcon };

const ALL_NAV: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/directory", icon: Building2, label: "Directory" },
  { to: "/playbook", icon: BookOpen, label: "Playbook" },
  { to: "/resources", icon: Library, label: "Resources" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/the-bar", icon: Gavel, label: "The Bar" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MORPH_SPRING = { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.7 };
const IDLE_MS = 1500;

type ActionKind = "join" | "search" | "log" | "none";

function getActionFor(pathname: string, scrolledPastHero: boolean): ActionKind {
  if (pathname === "/") return scrolledPastHero ? "join" : "none";
  if (pathname.startsWith("/directory")) return "search";
  if (pathname.startsWith("/app") || pathname.startsWith("/applications")) return "log";
  return "none";
}

function getActiveKey(pathname: string): string {
  const match = ALL_NAV.find((n) =>
    n.to === "/" ? pathname === "/" : pathname.startsWith(n.to),
  );
  return match?.to ?? "/";
}

export default function MobileBottomDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [hasCompareBar, setHasCompareBar] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Idle-collapse: pill when stable, expand on activity
  const idleTimer = useRef<number | null>(null);
  const resetIdle = () => {
    setCollapsed(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setCollapsed(true), IDLE_MS);
  };

  // Track scroll: drive both home-hero gate AND idle expand
  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.55);
      // Expand on any scroll, then re-collapse
      setCollapsed(false);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setCollapsed(true), IDLE_MS);
    };
    onScroll();
    // Start initial idle countdown
    idleTimer.current = window.setTimeout(() => setCollapsed(true), IDLE_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  // Reset to collapsed-after-idle on route change so each page starts fresh
  useEffect(() => {
    setCollapsed(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setCollapsed(true), IDLE_MS);
  }, [pathname]);

  // Yield to CompareBar on the directory page
  useEffect(() => {
    const check = () => setHasCompareBar(!!document.querySelector('[data-compare-bar="true"]'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Hide whenever a real input/textarea is focused (mobile keyboard up)
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest?.("[data-morph-dock]")) return;
      const tag = t.tagName;
      const editable = (t as HTMLElement).isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || editable) setInputFocused(true);
    };
    const onFocusOut = () => setInputFocused(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Sandboxed routes get nothing — dock-lab renders its own variants
  if (pathname.startsWith("/dock-lab")) return null;
  if (hasCompareBar) return null;

  const action = getActionFor(pathname, scrolledPastHero);
  const activeKey = getActiveKey(pathname);
  const activeItem = ALL_NAV.find((n) => n.to === activeKey) ?? ALL_NAV[0];
  const ActiveIcon = activeItem.icon;

  // Hide entirely on home before scrolling past the hero, or when an input is focused
  const hidden = inputFocused || (pathname === "/" && !scrolledPastHero);

  const handleAction = () => {
    if (action === "search") {
      setSearchOpen(true);
      resetIdle();
      return;
    }
    if (action === "log") {
      window.dispatchEvent(new CustomEvent("open-log-application"));
      resetIdle();
      return;
    }
    if (action === "join") {
      const target = document.getElementById("waitlist");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      else navigate("/waitlist");
      resetIdle();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <LayoutGroup>
            <motion.nav
              key="dock"
              data-morph-dock
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="fixed bottom-5 left-0 right-0 z-40 px-4 flex items-end justify-center gap-2 pointer-events-none md:hidden"
            >
              {/* LEFT pill — nav */}
              <motion.div
                layout
                transition={MORPH_SPRING}
                onClick={() => collapsed && resetIdle()}
                style={{ WebkitBackdropFilter: "blur(24px) saturate(160%)" }}
                className={`pointer-events-auto bg-background/55 backdrop-blur-2xl backdrop-saturate-150 border-2 border-foreground/70 rounded-full overflow-hidden shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18),0_8px_32px_-8px_hsl(var(--accent)/0.35),3px_3px_0_0_hsl(var(--accent))] ${
                  collapsed ? "cursor-pointer" : ""
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {collapsed ? (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1, ease: EASE }}
                      className="flex items-center gap-2 px-4 py-2.5"
                      aria-label="Expand navigation"
                    >
                      <ActiveIcon size={18} strokeWidth={2.5} className="text-accent" />
                      <span className="font-sora text-xs font-bold text-foreground">
                        {activeItem.label}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: 0.04, duration: 0.12, ease: EASE } }}
                      exit={{ opacity: 0, transition: { duration: 0.08, ease: EASE } }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5"
                    >
                      {ALL_NAV.map(({ to, label, icon: Icon }) => {
                        const isActive = activeKey === to;
                        return (
                          <Link
                            key={to}
                            to={to}
                            aria-label={label}
                            onTouchStart={() => prefetchRoute(to)}
                            onMouseEnter={() => prefetchRoute(to)}
                            onClick={(e) => {
                              e.stopPropagation();
                              resetIdle();
                            }}
                            className="relative w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Icon
                              size={20}
                              strokeWidth={isActive ? 2.5 : 1.8}
                              className={isActive ? "text-accent" : "text-muted-foreground"}
                            />
                            {isActive && (
                              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent" />
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* RIGHT pill — contextual action (omitted entirely when none) */}
              <AnimatePresence>
                {action !== "none" && (
                  <motion.div
                    key={action}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.92 }}
                    transition={MORPH_SPRING}
                    className="pointer-events-auto"
                  >
                    <ActionPill kind={action} onClick={handleAction} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.nav>
          </LayoutGroup>
        )}
      </AnimatePresence>

      {/* Search sheet — opens from the search action pill on /directory */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="border-t-2 border-foreground rounded-t-2xl">
          <SearchForm
            onSubmit={(q) => {
              const params = new URLSearchParams();
              if (q.trim()) params.set("q", q.trim());
              navigate(`/directory${params.toString() ? `?${params.toString()}` : ""}`);
              setSearchOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

function ActionPill({ kind, onClick }: { kind: ActionKind; onClick: () => void }) {
  const meta = getActionMeta(kind);
  if (!meta) return null;
  const Icon = meta.icon;

  if (kind === "search") {
    return (
      <button
        onClick={onClick}
        aria-label="Search"
        style={{ WebkitBackdropFilter: "blur(24px) saturate(160%)" }}
        className="w-12 h-12 flex items-center justify-center bg-background/55 backdrop-blur-2xl backdrop-saturate-150 border-2 border-foreground/70 rounded-full shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18),0_8px_32px_-8px_hsl(var(--accent)/0.35),3px_3px_0_0_hsl(var(--accent))] active:translate-x-[1px] active:translate-y-[1px] transition-transform"
      >
        <Icon size={18} strokeWidth={2.2} className="text-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={meta.label}
      style={{ WebkitBackdropFilter: "blur(20px) saturate(180%)" }}
      className="flex items-center gap-1.5 h-12 px-4 bg-accent/80 backdrop-blur-xl backdrop-saturate-150 text-foreground border-2 border-foreground/70 rounded-full shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.35),0_8px_28px_-8px_hsl(var(--accent)/0.6),3px_3px_0_0_hsl(var(--foreground))] active:translate-x-[1px] active:translate-y-[1px] transition-transform"
    >
      <Icon size={14} strokeWidth={2.5} />
      <span className="font-sora text-xs font-bold">{meta.label}</span>
    </button>
  );
}

function getActionMeta(kind: ActionKind): { label: string; icon: LucideIcon } | null {
  switch (kind) {
    case "join":
      return { label: "Join", icon: Send };
    case "log":
      return { label: "Log", icon: Plus };
    case "search":
      return { label: "Search", icon: Search };
    default:
      return null;
  }
}

function SearchForm({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(q);
      }}
      className="pt-2 pb-6"
    >
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
        Search
      </p>
      <div className="flex items-center gap-2 border-2 border-foreground rounded-full px-4 py-3 shadow-[3px_3px_0_0_hsl(var(--accent))]">
        <Search size={16} className="text-foreground shrink-0" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search firms, cities, PQE…"
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground font-inter"
        />
      </div>
    </form>
  );
}
