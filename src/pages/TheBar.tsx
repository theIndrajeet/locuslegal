import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, History, LogIn, Sparkles } from "lucide-react";
import { StatsStrip } from "@/components/bar/StatsStrip";
import { AttemptListItem } from "@/components/bar/AttemptListItem";
import { AttemptReviewDialog } from "@/components/bar/AttemptReviewDialog";
import { formatDesignation } from "@/lib/bar/display";
import type { BarDesignation } from "@/lib/bar/types";

interface Stats {
  total_points: number;
  accuracy_pct: number;
  current_streak: number;
  longest_streak: number;
  designation: BarDesignation;
}

interface RecentAttempt {
  id: string;
  is_correct: boolean;
  points_awarded: number;
  attempted_at: string;
  bar_challenges: {
    title: string;
    question_type: string;
  } | null;
}

export default function TheBar() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const designationLabel = stats ? formatDesignation(stats.designation) : "Trainee";
  usePageMeta({
    title: userId ? `The Bar — ${designationLabel} · Locus` : "The Bar — prove you can lawyer",
    description: "Take legal challenges, earn points, climb from Trainee to Silk.",
    path: "/the-bar",
  });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthReady(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authReady || !userId) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const [statsRes, recentRes] = await Promise.all([
        supabase.from("bar_user_stats").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("bar_attempts")
          .select("id, is_correct, points_awarded, attempted_at, bar_challenges(title, question_type)")
          .eq("user_id", userId)
          .order("attempted_at", { ascending: false })
          .limit(10),
      ]);
      if (!active) return;
      setStats(
        (statsRes.data as Stats | null) ?? {
          total_points: 0,
          accuracy_pct: 0,
          current_streak: 0,
          longest_streak: 0,
          designation: "trainee",
        },
      );
      setRecent((recentRes.data ?? []) as RecentAttempt[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authReady, userId]);

  if (!authReady) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={36} className="text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-foreground mb-3">
            The Bar
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Prove you can lawyer. Earn points. Climb from Trainee to Silk.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              <LogIn size={16} /> Sign in to enter The Bar
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground mb-2">
            The Bar
          </h1>
          <p className="text-lg text-muted-foreground">
            prove you can lawyer. rank up. get seen.
          </p>
        </div>

        {/* Stats */}
        {loading || !stats ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsStrip
            designation={stats.designation}
            totalPoints={stats.total_points}
            accuracyPct={Number(stats.accuracy_pct)}
            currentStreak={stats.current_streak}
          />
        )}

        {/* Quick actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/the-bar/browse" className="flex-1">
            <Button size="lg" className="w-full gap-2 h-14 text-base font-bold">
              Take a Challenge <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/the-bar/history">
            <Button size="lg" variant="outline" className="gap-2 h-14 w-full sm:w-auto">
              <History size={18} /> View Full History
            </Button>
          </Link>
        </div>

        {/* Recent attempts */}
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground mb-4">
            Recent Attempts
          </h2>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recent.length === 0 ? (
            <Card className="border-2 border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't taken a challenge yet.
              </p>
              <Link to="/the-bar/browse">
                <Button className="gap-2">
                  Take your first one <ArrowRight size={16} />
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => (
                <AttemptListItem
                  key={a.id}
                  title={a.bar_challenges?.title ?? "Challenge"}
                  question_type={(a.bar_challenges?.question_type ?? "mcq") as any}
                  is_correct={a.is_correct}
                  points_awarded={a.points_awarded}
                  attempted_at={a.attempted_at}
                  onClick={() => setReviewId(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AttemptReviewDialog
        attemptId={reviewId}
        open={!!reviewId}
        onOpenChange={(v) => !v && setReviewId(null)}
      />
    </section>
  );
}
