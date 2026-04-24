import { useEffect, useState } from "react";
import { Moon, Sun, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import { useAdminRole } from "@/hooks/useAdminRole";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Directory", href: "/directory" },
  { label: "Playbook", href: "/playbook" },
  { label: "Resources", href: "/resources" },
  { label: "Tools", href: "/tools" },
  { label: "Applications", href: "/applications", pulse: true },
  { label: "The Bar", href: "/the-bar", glitch: true },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isAdmin = useAdminRole();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => location.pathname === href;
  const forceOpaque = location.pathname.startsWith("/the-bar/challenge");

  const renderChip = (l: typeof navLinks[number]) => {
    const active = isActive(l.href);
    const base =
      "relative whitespace-nowrap rounded-full border border-border/60 px-3.5 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200 snap-center shrink-0";
    const activeClass =
      "bg-accent text-accent-foreground border-accent shadow-[0_0_12px_hsl(var(--accent)/0.35)]";
    const inactiveClass =
      "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95";

    return (
      <Link
        key={l.href}
        to={l.href}
        className={`${base} ${active ? activeClass : inactiveClass}`}
        {...(l.glitch ? { "data-text": l.label } : {})}
      >
        <span className={`inline-flex items-center gap-1 ${l.glitch ? "glitch-link" : ""}`}>
          {l.pulse && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
          {l.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || forceOpaque
          ? "bg-background/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        <Link to="/" className="font-heading tracking-tight leading-none">
          <span className="text-2xl font-extrabold">
            Loc<span className="text-accent">us</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) =>
            l.pulse ? (
              <Link
                key={l.href}
                to={l.href}
                className={`relative text-sm font-bold transition-all duration-300 group ${
                  isActive(l.href) ? "text-accent" : "text-muted-foreground hover:text-accent"
                }`}
              >
                <span className="relative z-10 inline-flex items-center gap-1">
                  <span className="inline-block animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] w-1.5 h-1.5 rounded-full bg-accent" />
                  {l.label}
                </span>
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ) : l.glitch ? (
              <Link
                key={l.href}
                to={l.href}
                className={`relative text-sm font-bold transition-all duration-300 glitch-link ${
                  isActive(l.href) ? "text-accent" : "text-muted-foreground hover:text-accent"
                }`}
                data-text={l.label}
              >
                {l.label}
              </Link>
            ) : (
              <Link
                key={l.href}
                to={l.href}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive(l.href)
                    ? "text-accent"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                {l.label}
              </Link>
            )
          )}
          {isAdmin && (
            <Link
              to="/admin/bar"
              className={`text-sm font-medium transition-colors duration-300 inline-flex items-center gap-1 ${
                isActive("/admin/bar") ? "text-accent" : "text-muted-foreground hover:text-accent"
              }`}
            >
              <Shield size={14} /> Admin
            </Link>
          )}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <ProfileMenu />
        </div>

        {/* Mobile theme toggle + profile */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <ProfileMenu />
        </div>
      </div>

    </nav>
  );
}
