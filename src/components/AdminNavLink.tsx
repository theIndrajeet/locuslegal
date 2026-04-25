/**
 * AdminNavLink — only checks admin role (and pulls supabase) on idle, after
 * the home page has stabilized. Keeps the navbar render free of supabase
 * dependencies for anonymous visitors.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { prefetchRoute } from "@/lib/prefetch";

export default function AdminNavLink() {
  const [enabled, setEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Defer the decision to mount until idle so the supabase-backed hook
  // doesn't run during the home page's critical render.
  useEffect(() => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) {
      ric(() => setEnabled(true), { timeout: 5000 });
    } else {
      const t = window.setTimeout(() => setEnabled(true), 3000);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Only when enabled do we dynamically pull the admin-role hook (which
  // pulls supabase). React rules don't allow conditional hook calls, so we
  // mount a tiny child that runs the hook only when needed.
  if (!enabled) return null;
  return <AdminCheck onResult={setIsAdmin} render={isAdmin} location={location.pathname} />;
}

function AdminCheck({
  onResult,
  render,
  location,
}: {
  onResult: (v: boolean) => void;
  render: boolean;
  location: string;
}) {
  // Lazy-imported so the bundle of useAdminRole + supabase only loads here.
  const [Hook, setHook] = useState<null | (() => boolean | null)>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/hooks/useAdminRole").then((m) => {
      if (!cancelled) setHook(() => m.useAdminRole);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Hook) return null;
  return <AdminCheckInner Hook={Hook} onResult={onResult} render={render} location={location} />;
}

function AdminCheckInner({
  Hook,
  onResult,
  render,
  location,
}: {
  Hook: () => boolean | null;
  onResult: (v: boolean) => void;
  render: boolean;
  location: string;
}) {
  const isAdmin = Hook();
  useEffect(() => {
    if (typeof isAdmin === "boolean") onResult(isAdmin);
  }, [isAdmin, onResult]);

  if (!render) return null;
  const active = location === "/admin/bar";
  return (
    <Link
      to="/admin/bar"
      onMouseEnter={() => prefetchRoute("/admin/bar")}
      onFocus={() => prefetchRoute("/admin/bar")}
      className={`text-sm font-medium transition-colors duration-300 inline-flex items-center gap-1 ${
        active ? "text-accent" : "text-muted-foreground hover:text-accent"
      }`}
    >
      <Shield size={14} /> Admin
    </Link>
  );
}
