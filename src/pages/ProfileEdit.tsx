import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import IdentitySection from "@/components/profile/IdentitySection";
import AcademicsSection from "@/components/profile/AcademicsSection";
import InternshipsSection, { Internship } from "@/components/profile/InternshipsSection";
import MootsSection, { Moot } from "@/components/profile/MootsSection";
import PublicationsSection, { Publication } from "@/components/profile/PublicationsSection";
import CvSection from "@/components/profile/CvSection";

type Degree = "BA LLB" | "BBA LLB" | "BCom LLB" | "LLB (3yr)" | "LLM" | "Other";

export default function ProfileEdit() {
  usePageMeta({ title: "Edit Profile", description: "Update your Locus merit profile.", path: "/profile/edit" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Identity
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Academics
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState<Degree | "">("");
  const [graduationYear, setGraduationYear] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  // Lists
  const [internships, setInternships] = useState<Internship[]>([]);
  const [moots, setMoots] = useState<Moot[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  // CV
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploadedAt, setCvUploadedAt] = useState<string | null>(null);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) { navigate("/auth"); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [profileRes, internshipsRes, mootsRes, pubsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("profile_internships").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
        supabase.from("profile_moots").select("*").eq("user_id", uid).order("year", { ascending: false }),
        supabase.from("profile_publications").select("*").eq("user_id", uid).order("publication_date", { ascending: false }),
      ]);

      if (!mounted) return;

      if (profileRes.data) {
        const p = profileRes.data;
        setDisplayName(p.display_name || "");
        setUsername(p.username || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || null);
        setCollege(p.college || "");
        setDegree((p.degree as Degree) || "");
        setGraduationYear(p.graduation_year ? String(p.graduation_year) : "");
        setCgpa(p.cgpa !== null && p.cgpa !== undefined ? String(p.cgpa) : "");
        setSubjects(p.subjects_of_interest || []);
        setCvUrl(p.cv_url || null);
        setCvUploadedAt(p.cv_uploaded_at || null);
      }
      if (internshipsRes.data) setInternships(internshipsRes.data as Internship[]);
      if (mootsRes.data) setMoots(mootsRes.data as Moot[]);
      if (pubsRes.data) setPublications(pubsRes.data as Publication[]);

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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); setConfirmPassword(""); }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen px-4 py-20 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-9 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground font-heading">Edit Profile</h1>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <IdentitySection
          userId={userId}
          displayName={displayName} setDisplayName={setDisplayName}
          username={username} setUsername={setUsername}
          bio={bio} setBio={setBio}
          avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl}
        />

        <AcademicsSection
          userId={userId}
          college={college} setCollege={setCollege}
          degree={degree} setDegree={setDegree}
          graduationYear={graduationYear} setGraduationYear={setGraduationYear}
          cgpa={cgpa} setCgpa={setCgpa}
          subjects={subjects} setSubjects={setSubjects}
        />

        <InternshipsSection userId={userId} internships={internships} setInternships={setInternships} />
        <MootsSection userId={userId} moots={moots} setMoots={setMoots} />
        <PublicationsSection userId={userId} publications={publications} setPublications={setPublications} />
        <CvSection userId={userId} cvUrl={cvUrl} cvUploadedAt={cvUploadedAt} setCvUrl={setCvUrl} setCvUploadedAt={setCvUploadedAt} />

        <Card>
          <CardHeader><CardTitle className="font-heading">Change password</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-pwd">New password</Label>
              <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Confirm password</Label>
              <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPwd} size="sm">Update password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
