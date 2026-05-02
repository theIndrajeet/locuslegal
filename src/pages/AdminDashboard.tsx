import { useEffect, useState } from "react";
import {
  Users,
  ClipboardCheck,
  Briefcase,
  Scale,
  RefreshCw,
  Activity,
  MessageSquarePlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { StatCard, ToolTile } from "@/components/admin/AdminTiles";

interface Stats {
  waitlistTotal: number;
  waitlist7d: number;
  betaClaimed: number;
  betaSubmitted: number;
  vacanciesLive: number;
  vacanciesExpiringSoon: number;
  barPending: number;
  barAttempts24h: number;
}

const EMPTY: Stats = {
  waitlistTotal: 0,
  waitlist7d: 0,
  betaClaimed: 0,
  betaSubmitted: 0,
  vacanciesLive: 0,
  vacanciesExpiringSoon: 0,
  barPending: 0,
  barAttempts24h: 0,
};

export default function AdminDashboard() {
  usePageMeta({
    title: "Admin Dashboard — Locus",
    description: "Unified admin console for Locus.",
    path: "/admin",
  });

  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const sevenDays = new Date(Date.now() - 7 * 86400000).toISOString();
    const oneDay = new Date(Date.now() - 86400000).toISOString();
    const threeDays = new Date(Date.now() + 3 * 86400000).toISOString();

    const [
      waitlistTotalRes,
      waitlist7dRes,
      betaClaimedRes,
      betaSubmittedRes,
      vacLiveRes,
      vacSoonRes,
      barPendingRes,
      barAttemptsRes,
    ] = await Promise.all([
      supabase.from("waitlist_submissions").select("*", { count: "exact", head: true }),
      supabase.from("waitlist_submissions").select("*", { count: "exact", head: true }).gte("created_at", sevenDays),
      supabase.from("beta_testers").select("*", { count: "exact", head: true }),
      supabase.from("beta_testers").select("*", { count: "exact", head: true }).not("submitted_at", "is", null),
      supabase.from("vacancies").select("*", { count: "exact", head: true }).eq("status", "live").gt("expires_at", new Date().toISOString()),
      supabase.from("vacancies").select("*", { count: "exact", head: true }).eq("status", "live").gt("expires_at", new Date().toISOString()).lt("expires_at", threeDays),
      supabase.from("bar_challenges").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("bar_attempts").select("*", { count: "exact", head: true }).gte("attempted_at", oneDay),
    ]);

    setStats({
      waitlistTotal: waitlistTotalRes.count ?? 0,
      waitlist7d: waitlist7dRes.count ?? 0,
      betaClaimed: betaClaimedRes.count ?? 0,
      betaSubmitted: betaSubmittedRes.count ?? 0,
      vacanciesLive: vacLiveRes.count ?? 0,
      vacanciesExpiringSoon: vacSoonRes.count ?? 0,
      barPending: barPendingRes.count ?? 0,
      barAttempts24h: barAttemptsRes.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Console
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-black">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything in one place. All admin tools, live numbers, recent activity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Waitlist"
          value={stats.waitlistTotal}
          sub={`+${stats.waitlist7d} in last 7d`}
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Beta Testers"
          value={`${stats.betaSubmitted}/${stats.betaClaimed}`}
          sub="submitted / claimed"
          icon={ClipboardCheck}
          loading={loading}
        />
        <StatCard
          label="Live Vacancies"
          value={stats.vacanciesLive}
          sub={`${stats.vacanciesExpiringSoon} expiring in 3d`}
          icon={Briefcase}
          loading={loading}
        />
        <StatCard
          label="Bar Pending"
          value={stats.barPending}
          sub={`${stats.barAttempts24h} attempts (24h)`}
          icon={Scale}
          loading={loading}
        />
        <StatCard
          label="Activity (24h)"
          value={stats.barAttempts24h + stats.waitlist7d}
          sub="bar + waitlist"
          icon={Activity}
          loading={loading}
        />
      </section>

      {/* Tool tiles */}
      <section>
        <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 bg-accent" /> Admin tools
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolTile
            to="/admin/waitlist"
            title="Waitlist"
            description="Browse and filter signups by audience."
            icon={Users}
          />
          <ToolTile
            to="/admin/beta"
            title="Beta Testers"
            description="Review tester feedback, screenshots, and CSV export."
            icon={ClipboardCheck}
          />
          <ToolTile
            to="/admin/vacancies"
            title="Vacancies"
            description="Curate the live vacancy board with AI extraction."
            icon={Briefcase}
          />
          <ToolTile
            to="/admin/bar"
            title="The Bar"
            description="Sources, challenges, stats, and AI generation log."
            icon={Scale}
          />
          <ToolTile
            to="/admin/firm-suggestions"
            title="Firm Suggestions"
            description="Review user-submitted firm fixes and additions."
            icon={MessageSquarePlus}
          />
        </div>
      </section>
    </div>
  );
}
