import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuthSession } from "@/hooks/useAuthSession";
import VacancyCard from "@/components/vacancies/VacancyCard";
import DraftEmailDialog, { type DraftEmailTarget } from "@/components/apply/DraftEmailDialog";
import { type Vacancy, type VacancyApplication } from "@/lib/vacancies";

export default function Vacancies() {
  usePageMeta({
    title: "Live Vacancies — Locus",
    description: "Curated legal internship vacancies accepting email applications. New postings every week.",
    path: "/vacancies",
  });

  const { userId } = useAuthSession();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftFor, setDraftFor] = useState<{ vacancy: Vacancy; followup: boolean } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  // Map vacancy.id -> latest application meta for the signed-in user
  const [appMap, setAppMap] = useState<Map<string, VacancyApplication>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("vacancies")
        .select("*")
        .in("status", ["live", "archived"])
        .gt("expires_at", cutoff)
        .order("status", { ascending: true })
        .order("expires_at", { ascending: true });
      if (cancelled) return;
      setVacancies((data ?? []) as Vacancy[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!userId || vacancies.length === 0) {
      setAppMap(new Map());
      return;
    }
    const firmNames = Array.from(new Set(vacancies.map((v) => v.firm_name)));
    const { data } = await supabase
      .from("profile_applications")
      .select("id, firm_name_snapshot, role, applied_on, notes, status_updated_at")
      .eq("user_id", userId)
      .in("firm_name_snapshot", firmNames)
      .order("applied_on", { ascending: false });

    const map = new Map<string, VacancyApplication>();
    (data ?? []).forEach((row) => {
      // Match application -> vacancy by firm_name + role (case-insensitive)
      const v = vacancies.find(
        (x) =>
          x.firm_name.toLowerCase() === (row.firm_name_snapshot ?? "").toLowerCase() &&
          x.role.toLowerCase() === (row.role ?? "").toLowerCase(),
      );
      if (!v || map.has(v.id)) return; // keep latest only
      // Detect follow-up timestamp from notes marker
      let lastFollowupOn: string | null = null;
      if (row.notes) {
        const m = row.notes.match(/Follow-up sent on (\d{4}-\d{2}-\d{2})/g);
        if (m && m.length > 0) {
          const last = m[m.length - 1].match(/(\d{4}-\d{2}-\d{2})/);
          if (last) lastFollowupOn = last[1];
        }
      }
      map.set(v.id, {
        id: row.id,
        appliedOn: row.applied_on,
        lastFollowupOn,
      });
    });
    setAppMap(map);
  }, [userId, vacancies]);

  useEffect(() => {
    void refreshApplications();
  }, [refreshApplications]);

  // After load: if URL hash points at a vacancy, scroll to it.
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const live = useMemo(
    () => vacancies.filter((v) => v.status === "live" && new Date(v.expires_at).getTime() > Date.now()),
    [vacancies],
  );
  const archived = useMemo(
    () => vacancies.filter((v) => !(v.status === "live" && new Date(v.expires_at).getTime() > Date.now())),
    [vacancies],
  );

  const handleApply = (v: Vacancy, opts?: { followup?: boolean }) => {
    setDraftFor({ vacancy: v, followup: !!opts?.followup });
    setDraftOpen(true);
  };

  const draftTarget: DraftEmailTarget | null = draftFor
    ? (() => {
        const v = draftFor.vacancy;
        const existing = appMap.get(v.id);
        return {
          id: `vacancy-${v.id}${draftFor.followup ? "-followup" : ""}`,
          name: v.firm_name,
          email: v.application_email,
          kind: "firm",
          type: null,
          city: v.location,
          sector: null,
          practice_areas: null,
          legal_needs: v.description,
          followup:
            draftFor.followup && existing
              ? {
                  originalAppliedOn: existing.appliedOn,
                  originalRole: v.role,
                  applicationId: existing.id,
                }
              : null,
        };
      })()
    : null;

  return (
    <main className="pt-24 pb-16">
      <section className="container mx-auto px-4 md:px-8 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-foreground/70 bg-accent/15 mb-4">
          <Sparkles size={14} className="text-accent" />
          <span className="font-bold text-xs uppercase tracking-wider">Curated weekly</span>
        </div>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3">
          Live <span className="text-accent">Vacancies</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Hand-picked legal internship openings accepting email applications. Each one closes when the deadline expires —
          no infinite scroll, no stale listings.
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : live.length === 0 && archived.length === 0 ? (
        <section className="container mx-auto px-4 md:px-8">
          <div className="text-center py-16 max-w-md mx-auto bg-card border-2 border-dashed border-border rounded-2xl">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-heading text-lg font-extrabold mb-1">No live vacancies right now</p>
            <p className="text-sm text-muted-foreground">
              Check back tomorrow — new postings curated daily.
            </p>
          </div>
        </section>
      ) : (
        <>
          {live.length > 0 && (
            <section className="container mx-auto px-4 md:px-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {live.map((v) => (
                  <VacancyCard
                    key={v.id}
                    vacancy={v}
                    onApply={handleApply}
                    application={appMap.get(v.id) ?? null}
                  />
                ))}
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <section className="container mx-auto px-4 md:px-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-heading text-xl font-extrabold">Recently closed</h2>
                <span className="text-xs text-muted-foreground">Last 30 days · for reference only</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {archived.map((v) => (
                  <VacancyCard key={v.id} vacancy={v} archived />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <DraftEmailDialog
        open={draftOpen}
        onOpenChange={setDraftOpen}
        target={draftTarget}
        onSent={() => void refreshApplications()}
      />
    </main>
  );
}
