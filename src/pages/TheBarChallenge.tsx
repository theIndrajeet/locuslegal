// TheBarChallenge — student attempt flow.
//
// MANUAL TEST CASES:
// 1. Logged-out user → redirected to /auth.
// 2. Challenge not found / not approved → 404 state.
// 3. Already-attempted challenge → redirect to dashboard with toast.
// 4. MCQ flow: select option → submit → result screen.
// 5. Issue spotter with empty selection → marked incorrect, 0 pts.
// 6. Speed round timer hits 0 → auto-submits with current answers.
// 7. 20-attempts/day reached → submit returns 429.
// 8. Rank threshold crossed → result screen shows ranked-up banner.
//
// SECURITY: This page reads from `bar_challenges_student` (a view that strips
// `correct_option_id`, `correct_issue_ids`, and speed_round answers from the
// payload at the database layer). The raw correct answer NEVER crosses the wire.
// Underlying `bar_challenges` table is RLS-locked: only admins, the creator, or
// users who have already attempted may read it.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { McqRenderer } from "@/components/bar/renderers/McqRenderer";
import { IssueSpotterRenderer } from "@/components/bar/renderers/IssueSpotterRenderer";
import { JurisdictionRenderer } from "@/components/bar/renderers/JurisdictionRenderer";
import { SpeedRoundRenderer, type SpeedRoundAnswerState } from "@/components/bar/renderers/SpeedRoundRenderer";
import { ResultScreen, type ResultScreenProps } from "@/components/bar/ResultScreen";
import { AREA_OF_LAW_LABELS, QUESTION_TYPE_LABELS } from "@/lib/bar/constants";
import type { AreaOfLaw, Difficulty, QuestionType } from "@/lib/bar/types";

interface SafeChallenge {
  id: string;
  question_type: QuestionType;
  area_of_law: AreaOfLaw;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  points_base: number;
  source_citation: string | null;
  payload: any; // already-stripped from view
}

export default function TheBarChallenge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageMeta({
    title: "Challenge · The Bar · Locus",
    description: "Take this legal challenge and earn points.",
    path: `/the-bar/challenge/${id ?? ""}`,
  });

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<SafeChallenge | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Answer state per type
  const [mcqValue, setMcqValue] = useState("");
  const [issueValues, setIssueValues] = useState<string[]>([]);
  const [jurValue, setJurValue] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<ResultScreenProps | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
      setAuthReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) { navigate("/auth"); return; }
    if (!id) { setNotFound(true); setLoading(false); return; }

    let active = true;
    (async () => {
      setLoading(true);
      // Pre-check already attempted
      const { data: prior } = await supabase
        .from("bar_attempts")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", id)
        .maybeSingle();
      if (!active) return;
      if (prior) {
        toast.info("You've already attempted this challenge.");
        navigate("/the-bar");
        return;
      }

      // Fetch from SAFE view (correct answers stripped server-side)
      const { data: ch } = await supabase
        .from("bar_challenges_student" as any)
        .select("id, question_type, area_of_law, difficulty, title, prompt, points_base, source_citation, payload")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (!ch) { setNotFound(true); setLoading(false); return; }
      setChallenge((ch as unknown) as SafeChallenge);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authReady, userId, id, navigate]);

  const buildAnswer = (): unknown | null => {
    if (!challenge) return null;
    switch (challenge.question_type) {
      case "mcq":
        if (!mcqValue) return null;
        return { selected_option_id: mcqValue };
      case "issue_spotter":
        return { selected_issue_ids: issueValues };
      case "jurisdiction":
        if (!jurValue) return null;
        return { selected_option_id: jurValue };
      default:
        return null;
    }
  };

  const submit = async (override?: unknown) => {
    if (!challenge) return;
    const answer = override ?? buildAnswer();
    if (answer === null) {
      toast.error("Please make a selection first.");
      return;
    }
    setSubmitting(true);
    const time_taken_seconds = Math.floor((Date.now() - startedAt) / 1000);
    try {
      const { data, error } = await supabase.functions.invoke("submit-bar-attempt", {
        body: {
          challenge_id: challenge.id,
          submitted_answer: answer,
          time_taken_seconds,
        },
      });
      if (error) {
        const ctx = (error as any).context;
        let parsed: any = null;
        try {
          if (ctx && typeof ctx.json === "function") parsed = await ctx.json();
        } catch { /* ignore */ }
        const code = parsed?.error;
        if (code === "already_attempted") {
          toast.info("You've already attempted this challenge.");
          navigate("/the-bar");
          return;
        }
        if (code === "daily_cap_exceeded") {
          toast.error("Daily cap reached (20). Come back tomorrow.");
          navigate("/the-bar");
          return;
        }
        if (code === "challenge_not_approved" || code === "challenge_not_found") {
          toast.error("This challenge isn't available right now.");
          navigate("/the-bar/browse");
          return;
        }
        if (code === "grading_error" || code === "invalid_body") {
          toast.error("Your answer couldn't be graded. " + (parsed?.message ?? ""));
          return;
        }
        toast.error("Submission failed. Please try again.");
        return;
      }
      setResult(data as ResultScreenProps);
    } catch (e) {
      console.error(e);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authReady) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    );
  }

  if (notFound || !challenge) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-2xl font-extrabold font-heading text-foreground mb-3">
            Challenge not found
          </h1>
          <p className="text-muted-foreground mb-6">This challenge may have been archived or isn't approved yet.</p>
          <Link to="/the-bar/browse">
            <Button>Browse Challenges</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4">
          <ResultScreen {...result} />
        </div>
      </section>
    );
  }

  const canSubmitDirect = (() => {
    switch (challenge.question_type) {
      case "mcq": return !!mcqValue;
      case "issue_spotter": return true;
      case "jurisdiction": return !!jurValue;
      default: return false;
    }
  })();

  return (
    <section className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft size={16} /> Back
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{QUESTION_TYPE_LABELS[challenge.question_type]}</Badge>
          <Badge variant="outline">{AREA_OF_LAW_LABELS[challenge.area_of_law]}</Badge>
          <Badge variant="outline" className="capitalize">{challenge.difficulty}</Badge>
          <div className="ml-auto text-sm font-semibold text-accent">
            Worth up to {challenge.points_base} pts
          </div>
        </div>
        {challenge.source_citation && (
          <div className="text-xs italic text-muted-foreground">{challenge.source_citation}</div>
        )}

        <Card className="border-2 border-border p-6">
          <p className="text-base md:text-lg leading-relaxed text-foreground whitespace-pre-wrap">
            {challenge.prompt}
          </p>
        </Card>

        <div>
          {challenge.question_type === "mcq" && (
            <McqRenderer
              mode="answer"
              payload={{ options: challenge.payload.options ?? [] }}
              value={mcqValue}
              onChange={setMcqValue}
            />
          )}
          {challenge.question_type === "issue_spotter" && (
            <IssueSpotterRenderer
              mode="answer"
              payload={{ issue_options: challenge.payload.issue_options ?? [] }}
              selected={issueValues}
              onChange={setIssueValues}
            />
          )}
          {challenge.question_type === "jurisdiction" && (
            <JurisdictionRenderer
              mode="answer"
              payload={{ options: challenge.payload.options ?? [] }}
              value={jurValue}
              onChange={setJurValue}
            />
          )}
          {challenge.question_type === "speed_round" && (
            <SpeedRoundRenderer
              mode="answer"
              payload={{
                questions: challenge.payload.questions ?? [],
                time_limit_seconds: challenge.payload.time_limit_seconds ?? 60,
              }}
              onComplete={(answer: SpeedRoundAnswerState) => submit(answer)}
            />
          )}
        </div>

        {challenge.question_type !== "speed_round" && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => submit()}
              disabled={submitting || !canSubmitDirect}
              className="gap-2 min-w-[160px]"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Grading…</> : "Submit"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
