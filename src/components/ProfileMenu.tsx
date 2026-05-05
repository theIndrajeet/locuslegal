import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, LogOut, KeyRound, PenLine, User, ExternalLink, Shield, Briefcase, Sparkles, Download, Share, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminRole";
import { useReplayTour } from "@/hooks/useReplayTour";
import { useInstallLocus } from "@/hooks/useInstallLocus";
import type { Session } from "@supabase/supabase-js";

export default function ProfileMenu() {
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [iosCardOpen, setIosCardOpen] = useState(false);
  const navigate = useNavigate();
  const { hasAnyScope, hasScope } = useAdminAccess();
  const replayTour = useReplayTour();
  const { isInstalled, triggerInstall } = useInstallLocus();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to actual sign-in / sign-out — TOKEN_REFRESHED and
      // INITIAL_SESSION fire frequently and would otherwise trigger redundant
      // profile fetches that race the rest of the app.
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else { setDisplayName(null); setUsername(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("display_name, username").eq("id", uid).maybeSingle();
    setDisplayName(data?.display_name || null);
    setUsername(data?.username || null);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    setSession(null);
    setDisplayName(null);
    setUsername(null);
    navigate("/");
    toast.success("Signed out");
  };

  const handleResetPassword = async () => {
    const email = session?.user?.email;
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
    setOpen(false);
  };

  const Divider = () => <div className="h-px bg-border my-1" />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Profile menu"
        >
          <UserCircle
            size={20}
            className={session ? "text-accent" : "text-muted-foreground"}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        {session ? (
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 border-b border-border mb-1">
              <div className="text-sm font-semibold text-foreground truncate">
                {displayName || session.user.email}
              </div>
              {username && (
                <div className="text-xs text-muted-foreground truncate">@{username}</div>
              )}
            </div>

            <button
              onClick={() => { setOpen(false); navigate("/profile/edit"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <User size={16} /> Edit Profile
            </button>
            {username && (
              <button
                onClick={() => { setOpen(false); navigate(`/u/${username}`); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
              >
                <ExternalLink size={16} /> View My Profile
              </button>
            )}
            <button
              onClick={() => { setOpen(false); navigate("/applications"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <Briefcase size={16} /> Applications
            </button>

            <Divider />

            <button
              onClick={() => { setOpen(false); navigate("/profile/edit"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <PenLine size={16} /> Change Username
            </button>
            <button
              onClick={handleResetPassword}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <KeyRound size={16} /> Change Password
            </button>

            <Divider />

            <button
              onClick={() => { setOpen(false); replayTour(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <Sparkles size={16} /> Replay product tour
            </button>

            <Divider />

            {hasAnyScope && (
              <>
                <button
                  onClick={() => { setOpen(false); navigate("/admin"); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-accent rounded-md hover:bg-accent/10 transition-colors"
                >
                  <Shield size={16} /> Admin Console
                </button>
                {hasScope("opportunities_admin") && (
                  <button
                    onClick={() => { setOpen(false); navigate("/admin/opportunities"); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-accent rounded-md hover:bg-accent/10 transition-colors"
                  >
                    <Briefcase size={16} /> Admin Opportunities
                  </button>
                )}
                <Divider />
              </>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        ) : (
          <Button
            variant="default"
            className="w-full"
            onClick={() => { setOpen(false); navigate("/auth"); }}
          >
            Sign In
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
