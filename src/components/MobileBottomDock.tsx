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
  X,
  Slash,
  type LucideIcon,
} from "lucide-react";
import { prefetchRoute } from "@/lib/prefetch";

type MorphState = "hidden" | "pill" | "split" | "search" | "orb";

type NavItem = { to: string; label: string; icon: LucideIcon };

const ALL_NAV: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/directory", icon: Building2, label: "Directory" },
  { to: "/playbook", icon: BookOpen, label: "Playbook" },
  { to: "/resources", icon: Library, label: "Resources" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/the-bar", icon: Gavel, label: "The Bar" },
];

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const DURATION = 0.32;

// ---------- State derivation ----------

function getStateFor(pathname: string, scrolledPastHero: boolean): MorphState {
  // Home: hide while hero is in view, then morph to Split (Join Waitlist).
  if (pathname === "/") return scrolledPastHero ? "split" : "hidden";
  if (pathname.startsWith("/directory")) return "search";
  if (pathname.startsWith("/the-bar")) return "orb";
  if (pathname.startsWith("/app") || pathname.startsWith("/applications")) return "split";
  // Browsing surfaces: pill.
  return "pill";
}

function getActiveKey(pathname: string): string {
  const match = ALL_NAV.find(
    (n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)),
  );
  return match?.to ?? "/";
}

// ---------- Main component ----------

export default function MobileBottomDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [hasCompareBar, setHasCompareBar] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [orbOpen, setOrbOpen] = useState(false);

  // Track scroll position — used only on home to decide hidden vs split.
  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY > window.innerHeight * 0.55);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Yield to CompareBar on the directory page.
  useEffect(() => {
    const check = () => setHasCompareBar(!!document.querySelector('[data-compare-bar="true"]'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Hide whenever a real input/textarea is focused (mobile keyboard up).
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      const editable = (t as HTMLElement).isContentEditable;
      // Ignore the dock's own search input — it should stay visible while typing.
      if (t.closest?.("[data-morph-dock]")) return;
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

  // Close orb on route change.
  useEffect(() => setOrbOpen(false), [pathname]);

  // Sandboxed routes get nothing — dock-lab renders its own variants.
  if (pathname.startsWith("/dock-lab")) return null;
  if (hasCompareBar) return null;

  const baseState = getStateFor(pathname, scrolledPastHero);
  const state: MorphState = inputFocused ? "hidden" : baseState;
  const activeKey = getActiveKey(pathname);

  return (
    <LayoutGroup>
      <AnimatePresence>
        {state === "orb" && orbOpen && (
          <motion.button
            key="scrim"
            aria-label="Close menu"
            onClick={() => setOrbOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-background/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state !== "hidden" && (
          <motion.div
            key="morph-anchor"
            data-morph-dock
            className="fixed bottom-5 z-40 pointer-events-none md:hidden"
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: 1,
              y: 0,
              left: state === "orb" ? "auto" : "1rem",
              right: state === "orb" ? "1.5rem" : "1rem",
              justifyContent: state === "orb" ? "flex-end" : "center",
            }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: DURATION, ease: EASE }}
            style={{ display: "flex" }}
          >
            <motion.div
              layout
              transition={{ duration: DURATION, ease: EASE }}
              className={`pointer-events-auto bg-background border-2 border-foreground overflow-hidden rounded-full ${
                state === "orb"
                  ? "shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                  : "shadow-[3px_3px_0_0_hsl(var(--accent))]"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {state === "pill" && <PillContents key="pill" activeKey={activeKey} />}
                {state === "split" && (
                  <SplitContents
                    key="split"
                    activeKey={activeKey}
                    pathname={pathname}
                    onAction={() => handleSplitAction(pathname, navigate)}
                  />
                )}
                {state === "search" && <SearchContents key="search" />}
                {state === "orb" && (
                  <OrbContents
                    key="orb"
                    open={orbOpen}
                    onToggle={() => setOrbOpen((v) => !v)}
                    activeKey={activeKey}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

// ---------- Action handlers ----------

function handleSplitAction(pathname: string, navigate: ReturnType<typeof useNavigate>) {
  if (pathname.startsWith("/app") || pathname.startsWith("/applications")) {
    window.dispatchEvent(new CustomEvent("open-log-application"));
    return;
  }
  // Home (or anything else that lands on Split): scroll to in-page #waitlist
  // if present, otherwise navigate.
  const target = document.getElementById("waitlist");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    navigate("/waitlist");
  }
}

function getSplitMeta(pathname: string): { label: string; icon: LucideIcon } {
  if (pathname.startsWith("/app") || pathname.startsWith("/applications")) {
    return { label: "Log", icon: Plus };
  }
  return { label: "Join", icon: Send };
}

// ---------- Sub-state contents ----------

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.12, duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

function PillContents({ activeKey }: { activeKey: string }) {
  return (
    <motion.div {...fade} className="flex items-center gap-3 px-4 py-2.5">
      {ALL_NAV.map(({ to, label, icon: Icon }) => {
        const isActive = activeKey === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            onTouchStart={() => prefetchRoute(to)}
            onMouseEnter={() => prefetchRoute(to)}
            className="relative w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={isActive ? "text-accent" : "text-muted-foreground"}
            />
            {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </motion.div>
  );
}

function SplitContents({
  activeKey,
  pathname,
  onAction,
}: {
  activeKey: string;
  pathname: string;
  onAction: () => void;
}) {
  // Pick 3 nav items; ensure the active one is included.
  const base = ["/", "/directory", "/the-bar"];
  const navs = (
    base.includes(activeKey) ? base : [activeKey, ...base.filter((b) => b !== activeKey)].slice(0, 3)
  )
    .map((to) => ALL_NAV.find((n) => n.to === to)!)
    .filter(Boolean);
  const meta = getSplitMeta(pathname);
  const ActionIcon = meta.icon;

  return (
    <motion.div {...fade} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5">
      {navs.map(({ to, label, icon: Icon }) => {
        const isActive = activeKey === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            onTouchStart={() => prefetchRoute(to)}
            onMouseEnter={() => prefetchRoute(to)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
          </Link>
        );
      })}
      <span className="w-px h-6 bg-foreground/30 mx-0.5" />
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-accent text-foreground active:translate-x-[1px] active:translate-y-[1px] transition-transform"
      >
        <ActionIcon size={14} strokeWidth={2.5} />
        <span className="font-sora text-xs font-bold">{meta.label}</span>
      </button>
    </motion.div>
  );
}

function SearchContents() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    navigate(`/directory${params.toString() ? `?${params.toString()}` : ""}`);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <motion.form
      {...fade}
      onSubmit={onSubmit}
      className="flex items-center gap-2.5 px-4 py-3 min-w-[280px]"
    >
      <Search size={16} className="text-foreground shrink-0" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search firms, cities, PQE…"
        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground font-inter min-w-0"
      />
      <span className="flex items-center justify-center w-5 h-5 border border-foreground text-foreground font-mono text-[10px] shrink-0">
        <Slash size={10} strokeWidth={2.5} />
      </span>
    </motion.form>
  );
}

function OrbContents({
  open,
  onToggle,
  activeKey,
}: {
  open: boolean;
  onToggle: () => void;
  activeKey: string;
}) {
  const radius = 95;
  const startAngle = 180;
  const endAngle = 270;
  const step = (endAngle - startAngle) / (ALL_NAV.length - 1);

  return (
    <motion.div {...fade} className="relative w-14 h-14">
      {ALL_NAV.map(({ to, label, icon: Icon }, i) => {
        const angle = (startAngle + step * i) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isActive = activeKey === to;
        return (
          <motion.div
            key={to}
            initial={false}
            animate={{
              x: open ? x : 0,
              y: open ? y : 0,
              scale: open ? 1 : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{
              duration: 0.28,
              ease: EASE,
              delay: open ? i * 0.025 : (ALL_NAV.length - i) * 0.018,
            }}
            className="absolute inset-0 m-auto w-11 h-11"
            style={{ pointerEvents: open ? "auto" : "none" }}
          >
            <Link
              to={to}
              aria-label={label}
              onTouchStart={() => prefetchRoute(to)}
              onClick={onToggle}
              className={`w-full h-full flex items-center justify-center rounded-full bg-background border-2 border-foreground ${
                isActive
                  ? "shadow-[3px_3px_0_0_hsl(var(--accent))]"
                  : "shadow-[3px_3px_0_0_hsl(var(--foreground))]"
              }`}
            >
              <Icon size={18} className={isActive ? "text-accent" : "text-foreground"} />
            </Link>
          </motion.div>
        );
      })}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={onToggle}
        className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center rounded-full bg-accent text-foreground active:translate-x-[1px] active:translate-y-[1px] transition-transform"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ display: "flex" }}
        >
          {open ? <X size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
        </motion.span>
      </button>
    </motion.div>
  );
}
