import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!mounted) return;
      setDisplayName(data?.display_name || "");
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) navigate("/auth");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSaveUsername = async () => {
    if (!userId || !displayName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: displayName.trim() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Username updated!");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-foreground font-heading">Edit Profile</h1>

        <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Username</h2>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
          <Button onClick={handleSaveUsername} disabled={saving} className="w-full">Save Username</Button>
        </div>

        <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Change Password</h2>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
          <Button onClick={handleChangePassword} disabled={saving} className="w-full">Update Password</Button>
        </div>

        <Button variant="outline" onClick={() => navigate(-1)} className="w-full">Back</Button>
      </div>
    </div>
  );
}
