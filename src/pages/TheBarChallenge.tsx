// TheBarChallenge — student attempt flow.
//
// Reads from the SAFE view `bar_challenges_student` (correct answers stripped
// at the database layer). Submits via the `submit-bar-attempt` edge function.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { McqRenderer } from "@/components/bar/renderers/McqRenderer";
import { IssueSpotterRenderer } from "@/components/bar/renderers/IssueSpotterRenderer";
import { JurisdictionRenderer } from "@/components/bar/renderers/JurisdictionRenderer";
import { SpeedRoundRenderer, type SpeedRoundAnswerState } from "@/components/bar/renderers/SpeedRoundRenderer";
import { DocumentReviewRenderer, type DocReviewAnswerState } from "@/components/bar/renderers/DocumentReviewRenderer";
import { BriefBuilderRenderer, type BriefAnswerState } from "@/components/bar/renderers/BriefBuilderRenderer";
import { EthicsRenderer, type EthicsAnswerState, type EthicsStage } from "@/components/bar/renderers/EthicsRenderer";
import { ClientCounselingRenderer, type CounselingAnswerState } from "@/components/bar/renderers/ClientCounselingRenderer";
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
  payload: any;
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

  // Per-type answer state
  const [mcqValue, setMcqValue] = useState("");
  const [issueValues, setIssueValues] = useState<string[]>([]);
  const [jurValue, setJurValue] = useState("");
  const [docReview, setDocReview] = useState<DocReviewAnswerState>({ flagged: [] });
  const [brief, setBrief] = useState<BriefAnswerState>({ step_answers: [] });
  const [briefStep, setBriefStep] = useState(0);
  const [ethics, setEthics] = useState<Partial<EthicsAnswerState>>({});
  const [ethicsStage, setEthicsStage] = useState<EthicsStage>("decision");
  const [counseling, setCounseling] = useState<CounselingAnswerState>({ turn_picks: [] });
  const [counselingTurn, setCounselingTurn] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<ResultScreenProps | null>(null);
  const [showSignInDialog, setShowSignInDialog] = useState(false);

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
    if (!id) { setNotFound(true); setLoading(false); return; }

    let active = true;
    (async () => {
      setLoading(true);
      if (userId) {
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
      }

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

  // Counseling: bump current turn when the active turn is answered
  const counselingTurnsCount = useMemo(
    () => (challenge?.payload?.decision_turns?.length ?? 0) as number,
    [challenge],
  );

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
      case "document_review":
        if (docReview.flagged.length === 0) return null;
        return docReview;
      case "brief_builder": {
        const totalSteps = challenge.payload?.steps?.length ?? 0;
        if (brief.step_answers.length < totalSteps) return null;
        return brief;
      }
      case "ethics":
        if (!ethics.selected_decision_id || !ethics.selected_followup_id) return null;
        return ethics as EthicsAnswerState;
      case "client_counseling":
        if (counseling.turn_picks.length < counselingTurnsCount) return null;
        return counseling;
      default:
        return null;
    }
  };

  const submit = async (override?: unknown) => {
    if (!challenge) return;
    if (!userId) {
      setShowSignInDialog(true);
      return;
    }
    const answer = override ?? buildAnswer();
    if (answer === null) {
      toast.error("Please complete every step before submitting.");
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
      setResult({
        ...(data as ResultScreenProps),
        challenge_meta: {
          title: challenge.title,
          question_type: challenge.question_type,
        },
      });
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

  // Brief Builder advance
  const briefSteps = (challenge.payload?.steps ?? []) as Array<unknown>;
  const briefAtLast = briefStep >= briefSteps.length - 1;
  const briefCurrentDone = brief.step_answers.some((a) => a.step_index === briefStep);

  // Counseling advance
  const counselingHasPick = counseling.turn_picks.some((p) => p.turn === counselingTurn);
  const counselingAtLast = counselingTurn >= counselingTurnsCount;

  // Ethics advance
  const ethicsCanAdvance =
    ethicsStage === "decision" ? !!ethics.selected_decision_id :
    ethicsStage === "consequence" ? !!ethics.selected_followup_id :
    false;

  const canSubmitDirect = (() => {
    switch (challenge.question_type) {
      case "mcq": return !!mcqValue;
      case "issue_spotter": return true;
      case "jurisdiction": return !!jurValue;
      case "document_review": return docReview.flagged.length > 0;
      case "brief_builder": return brief.step_answers.length >= briefSteps.length;
      case "ethics": return !!ethics.selected_decision_id && !!ethics.selected_followup_id;
      case "client_counseling": return counseling.turn_picks.length >= counselingTurnsCount;
      default: return false;
    }
  })();

  return (
    <section className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft size={16} /> Back
          </Button>
        </div>

        {!userId && (
          <Card className="border-2 border-accent/40 bg-accent/5 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 text-sm text-foreground">
              <span className="font-semibold">Previewing as guest.</span>{" "}
              <span className="text-muted-foreground">Sign in to submit and earn points.</span>
            </div>
            <Link to={`/auth?next=/the-bar/challenge/${challenge.id}`}>
              <Button size="sm" className="w-full sm:w-auto">Sign in</Button>
            </Link>
          </Card>
        )}

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
          <h1 className="text-xl font-extrabold font-heading mb-3">{challenge.title}</h1>
          <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
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
          {challenge.question_type === "document_review" && (
            <DocumentReviewRenderer
              mode="answer"
              payload={challenge.payload}
              value={docReview}
              onChange={setDocReview}
            />
          )}
          {challenge.question_type === "brief_builder" && (
            <BriefBuilderRenderer
              mode="answer"
              payload={challenge.payload}
              currentStep={briefStep}
              value={brief}
              onChange={setBrief}
              onAdvance={() => setBriefStep((s) => Math.min(s + 1, briefSteps.length - 1))}
            />
          )}
          {challenge.question_type === "ethics" && (
            <EthicsRenderer
              mode="answer"
              payload={challenge.payload}
              stage={ethicsStage}
              value={ethics}
              onChange={setEthics}
            />
          )}
          {challenge.question_type === "client_counseling" && (
            <ClientCounselingRenderer
              mode="answer"
              payload={challenge.payload}
              currentTurn={counselingTurn}
              value={counseling}
              onChange={setCounseling}
            />
          )}
        </div>

        {/* Per-type advance / submit row */}
        {challenge.question_type !== "speed_round" && (
          <div className="flex justify-end gap-2">
            {challenge.question_type === "brief_builder" && !briefAtLast && (
              <Button
                size="lg"
                onClick={() => setBriefStep((s) => Math.min(s + 1, briefSteps.length - 1))}
                disabled={!briefCurrentDone}
                className="gap-2"
              >
                Next step <ArrowRight size={16} />
              </Button>
            )}
            {challenge.question_type === "ethics" && ethicsStage === "decision" && (
              <Button
                size="lg"
                onClick={() => setEthicsStage("consequence")}
                disabled={!ethicsCanAdvance}
                className="gap-2"
              >
                Continue <ArrowRight size={16} />
              </Button>
            )}
            {challenge.question_type === "client_counseling" && !counselingAtLast && (
              <Button
                size="lg"
                onClick={() => setCounselingTurn((t) => t + 1)}
                disabled={!counselingHasPick}
                className="gap-2"
              >
                Send response <ArrowRight size={16} />
              </Button>
            )}

            {/* Submit appears once the format is complete */}
            {(
              challenge.question_type !== "brief_builder" || briefAtLast
            ) && (
              challenge.question_type !== "ethics" || ethicsStage === "consequence"
            ) && (
              challenge.question_type !== "client_counseling" || counselingAtLast
            ) && (
              <Button
                size="lg"
                onClick={() => submit()}
                disabled={submitting || !canSubmitDirect}
                className="gap-2 min-w-[160px]"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Grading…</> : "Submit"}
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in to submit your answer</AlertDialogTitle>
            <AlertDialogDescription>
              You're previewing this challenge as a guest. Sign in to submit, earn points, and climb the leaderboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/auth?next=/the-bar/challenge/${challenge.id}`)}>
              Sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
