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
            l.glitch ? (
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
          <Link
            to="/waitlist"
            className="font-heading text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-accent text-accent-foreground border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Join Waitlist
          </Link>
          <ProfileMenu />
        </div>

        {/* Mobile theme toggle + profile */}
        <div className="flex md:hidden items-center gap-1">
          <Link
            to="/waitlist"
            className="font-heading text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-accent text-accent-foreground border-2 border-foreground"
          >
            Join
          </Link>
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
