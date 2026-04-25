import { lazy, Suspense, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Defer the mobile dock — it's a fixed-position overlay that only appears on
// scroll, so it doesn't need to be in the home-page critical bundle.
const MobileBottomDock = lazy(() => import("./MobileBottomDock"));

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    // Lazy-import the supabase client so it stays out of the initial bundle.
    // The auth listener doesn't need to attach during FCP — a fresh visitor
    // is anonymous, and a returning user is fine waiting one tick.
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (cancelled) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            // Don't override navigation that Auth.tsx is already handling,
            // and don't bounce a user already on the username picker.
            if (
              location.pathname === "/auth" ||
              location.pathname === "/choose-username"
            ) {
              return;
            }

            // Only force the username picker for profiles with a truly empty
            // username. The handle_new_user trigger normally derives one from
            // the email, so this is effectively a no-op safety net.
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!profile?.username || profile.username.trim() === "") {
              navigate("/choose-username");
            }
          }
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
      <Suspense fallback={null}>
        <MobileBottomDock />
      </Suspense>
    </div>
  );
}
