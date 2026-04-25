import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, History, LogIn, Sparkles, Trophy } from "lucide-react";
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
  const { userId, ready: authReady } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [overallRank, setOverallRank] = useState<number | null>(null);
  const [optedOut, setOptedOut] = useState(false);

  const designationLabel = stats ? formatDesignation(stats.designation) : "Trainee";
  usePageMeta({
    title: userId ? `The Bar — ${designationLabel} · Locus` : "The Bar — prove you can lawyer",
    description: "Take legal challenges, earn points, climb from Trainee to Silk.",
    path: "/the-bar",
  });

  useEffect(() => {
    if (!authReady) return;
    if (!userId) { setLoading(false); return; }
    let active = true;
    const timeout = setTimeout(() => { if (active) setLoading(false); }, 8000);
    (async () => {
      setLoading(true);
      try {
        const [statsRes, recentRes, profileRes] = await Promise.all([
          supabase.from("bar_user_stats").select("*").eq("user_id", userId).maybeSingle(),
          supabase
            .from("bar_attempts")
            .select("id, is_correct, points_awarded, attempted_at, bar_challenges(title, question_type)")
            .eq("user_id", userId)
            .order("attempted_at", { ascending: false })
            .limit(10),
          supabase.from("profiles").select("bar_leaderboard_opt_out").eq("id", userId).maybeSingle(),
        ]);
        if (!active) return;
        const resolvedStats = (statsRes.data as Stats | null) ?? {
          total_points: 0,
          accuracy_pct: 0,
          current_streak: 0,
          longest_streak: 0,
          designation: "trainee",
        };
        setStats(resolvedStats);
        setRecent((recentRes.data ?? []) as RecentAttempt[]);
        setOptedOut(((profileRes.data as { bar_leaderboard_opt_out?: boolean } | null)?.bar_leaderboard_opt_out) ?? false);

        if (resolvedStats.total_points > 0) {
          const { count } = await supabase
            .from("bar_user_stats")
            .select("user_id", { count: "exact", head: true })
            .gt("total_points", resolvedStats.total_points);
          if (active) setOverallRank((count ?? 0) + 1);
        } else {
          setOverallRank(null);
        }
      } catch {
        /* defaults render below */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; clearTimeout(timeout); };
  }, [authReady, userId]);


  const isGuest = !userId;
  const displayStats = stats ?? {
    total_points: 0,
    accuracy_pct: 0,
    current_streak: 0,
    longest_streak: 0,
    designation: "trainee" as BarDesignation,
  };

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

        {/* Guest banner */}
        {isGuest && (
          <Card className="border-2 border-accent/40 bg-accent/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Sparkles size={20} className="text-accent flex-shrink-0" />
            <div className="flex-1 text-sm text-foreground">
              <span className="font-semibold">Browsing as guest.</span>{" "}
              <span className="text-muted-foreground">Sign in to take challenges, earn points, and climb the ranks.</span>
            </div>
            <Link to="/auth?next=/the-bar">
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <LogIn size={14} /> Sign in
              </Button>
            </Link>
          </Card>
        )}

        {/* Stats */}
        {(loading && !isGuest) ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsStrip
            designation={displayStats.designation}
            totalPoints={displayStats.total_points}
            accuracyPct={Number(displayStats.accuracy_pct)}
            currentStreak={displayStats.current_streak}
          />
        )}


        {/* Overall rank pill — logged-in users with attempts only */}
        {!isGuest && !loading && overallRank !== null && (
          <Link to="/the-bar/leaderboard?tab=all-time" className="inline-flex">
            <span className="inline-flex items-center gap-2 bg-accent/10 hover:bg-accent/20 transition-colors text-accent border border-accent/30 rounded-full px-4 py-1.5 text-sm font-semibold">
              <Trophy size={14} />
              You're #{overallRank.toLocaleString()} overall
              {optedOut && <span className="text-muted-foreground font-normal">(hidden from public)</span>}
            </span>
          </Link>
        )}

        {/* Quick actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/the-bar/browse" className="flex-1">
            <Button size="lg" className="w-full gap-2 h-14 text-base font-bold">
              Take a Challenge <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/the-bar/leaderboard">
            <Button size="lg" variant="outline" className="gap-2 h-14 w-full sm:w-auto">
              <Trophy size={18} /> View Leaderboard
            </Button>
          </Link>
          <Link to="/the-bar/history">
            <Button size="lg" variant="outline" className="gap-2 h-14 w-full sm:w-auto">
              <History size={18} /> History
            </Button>
          </Link>
        </div>

        {/* Recent attempts */}
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground mb-4">
            Recent Attempts
          </h2>
          {isGuest ? (
            <Card className="border-2 border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to track your attempts and earn points.
              </p>
              <Link to="/auth?next=/the-bar">
                <Button className="gap-2">
                  <LogIn size={16} /> Sign in
                </Button>
              </Link>
            </Card>
          ) : loading ? (
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
