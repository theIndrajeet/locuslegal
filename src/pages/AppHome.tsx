import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

import IdentityRow from "@/components/app/IdentityRow";
import ProfileStrengthMeter, { computeStrength } from "@/components/profile/ProfileStrengthMeter";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import OnboardingChecklist from "@/components/app/OnboardingChecklist";
import PracticePane from "@/components/app/PracticePane";
import PipelinePane from "@/components/app/PipelinePane";
import ShowcasePane from "@/components/app/ShowcasePane";
import QuickActionsFooter from "@/components/app/QuickActionsFooter";

interface DashboardData {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  openToOpportunities: boolean;
  bio: string;
  college: string;
  degree: string;
  graduationYear: string;
  cgpa: string;
  subjects: string[];
  internshipsCount: number;
  mootsCount: number;
  publicationsCount: number;
  cvUrl: string | null;
  applicationsCount: number;
  bar: {
    designation: string | null;
    totalPoints: number;
    currentStreak: number;
    totalAttempts: number;
  };
}

export default function AppHome() {
  usePageMeta({
    title: "Your dashboard — Locus",
    description: "Your profile, applications, and challenges in one place.",
    path: "/app",
  });

  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      if (!session) {
        navigate("/auth?redirect=/app", { replace: true });
        return;
      }

      const uid = session.user.id;

      try {
        const [profileRes, internshipsRes, mootsRes, pubsRes, statsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase
            .from("profile_internships")
            .select("id", { count: "exact", head: true })
            .eq("user_id", uid),
          supabase
            .from("profile_moots")
            .select("id", { count: "exact", head: true })
            .eq("user_id", uid),
          supabase
            .from("profile_publications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", uid),
          supabase.from("bar_user_stats").select("*").eq("user_id", uid).maybeSingle(),
        ]);

        if (!mounted) return;

        const p = profileRes.data;
        if (!p) {
          // Profile missing — let the layout's auth listener / username flow handle it.
          setLoading(false);
          return;
        }

        setData({
          userId: uid,
          username: p.username,
          displayName: p.display_name || "",
          avatarUrl: p.avatar_url,
          openToOpportunities: p.open_to_opportunities,
          bio: p.bio || "",
          college: p.college || "",
          degree: p.degree || "",
          graduationYear: p.graduation_year ? String(p.graduation_year) : "",
          cgpa: p.cgpa !== null && p.cgpa !== undefined ? String(p.cgpa) : "",
          subjects: p.subjects_of_interest || [],
          internshipsCount: internshipsRes.count ?? 0,
          mootsCount: mootsRes.count ?? 0,
          publicationsCount: pubsRes.count ?? 0,
          cvUrl: p.cv_url,
          applicationsCount: p.applications_count ?? 0,
          bar: {
            designation: statsRes.data?.designation ?? null,
            totalPoints: statsRes.data?.total_points ?? 0,
            currentStreak: statsRes.data?.current_streak ?? 0,
            totalAttempts: statsRes.data?.total_attempts ?? 0,
          },
        });
      } catch (e) {
        console.error("[AppHome] load error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) navigate("/auth?redirect=/app", { replace: true });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading || !data) {
    return (
      <div className="min-h-screen px-4 pt-24 pb-10 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const meterInputs = {
    avatarUrl: data.avatarUrl,
    bio: data.bio,
    college: data.college,
    degree: data.degree,
    graduationYear: data.graduationYear,
    cgpa: data.cgpa,
    subjectsCount: data.subjects.length,
    internshipsCount: data.internshipsCount,
    mootsCount: data.mootsCount,
    publicationsCount: data.publicationsCount,
    cvUrl: data.cvUrl,
    applicationsCount: data.applicationsCount,
  };
  const { items, score } = computeStrength(meterInputs);
  const showOnboarding = score < 30;

  return (
    <div className="min-h-screen px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <IdentityRow
          userId={data.userId}
          username={data.username}
          displayName={data.displayName}
          avatarUrl={data.avatarUrl}
          openToOpportunities={data.openToOpportunities}
          bio={data.bio}
        />

        <ProfileStrengthMeter variant="full" {...meterInputs} />

        <section className="border-2 border-border bg-card p-5 shadow-[3px_3px_0_0_hsl(var(--border))]">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Your activity
          </div>
          <ActivityHeatmap userId={data.userId} />
        </section>

        {showOnboarding ? (
          <OnboardingChecklist items={items} score={score} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mobile order: Pipeline (1) → Practice (2) → Showcase (3); Desktop: Practice → Pipeline → Showcase */}
            <div className="order-2 md:order-1">
              <PracticePane
                designation={data.bar.designation}
                totalPoints={data.bar.totalPoints}
                currentStreak={data.bar.currentStreak}
                totalAttempts={data.bar.totalAttempts}
              />
            </div>
            <div className="order-1 md:order-2">
              <PipelinePane userId={data.userId} />
            </div>
            <div className="order-3 md:order-3">
              <ShowcasePane
                userId={data.userId}
                username={data.username}
                internshipsCount={data.internshipsCount}
                mootsCount={data.mootsCount}
                publicationsCount={data.publicationsCount}
                hasCv={!!data.cvUrl}
              />
            </div>
          </div>
        )}

        <QuickActionsFooter />
      </div>
    </div>
  );
}
