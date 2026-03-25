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
          // Check if user needs to pick a username
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile?.display_name || profile.display_name.trim() === "") {
            navigate("/choose-username");
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
      <MobileBottomDock />
    </div>
  );
}
