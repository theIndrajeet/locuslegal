import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomDock from "./MobileBottomDock";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  // Challenge attempt pages own their full layout (PremiumShell has its own
  // sidebar, sticky top bar, and sticky footer CTA). Rendering the global
  // Navbar/Footer/Mobile dock on top of that creates overlapping chrome.
  const isChallengeRoute = location.pathname.startsWith("/the-bar/challenge/");

  return (
    <div className="min-h-screen">
      {!isChallengeRoute && <Navbar />}
      <Outlet />
      {!isChallengeRoute && <Footer />}
      {!isChallengeRoute && <MobileBottomDock />}
    </div>
  );
}
