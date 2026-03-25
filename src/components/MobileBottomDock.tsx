import { Link, useLocation } from "react-router-dom";
import { Home, Building2, BookOpen, Library, Wrench, Gavel } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/directory", icon: Building2, label: "Directory" },
  { to: "/playbook", icon: BookOpen, label: "Playbook" },
  { to: "/resources", icon: Library, label: "Resources" },
  { to: "/tools", icon: Wrench, label: "Tools", pulse: true },
  { to: "/the-bar", icon: Gavel, label: "The Bar" },
];

export default function MobileBottomDock() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden animate-slide-up-dock">
      <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-background/60 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/10">
        {NAV_ITEMS.map(({ to, icon: Icon, label, pulse }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
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
              {pulse && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
