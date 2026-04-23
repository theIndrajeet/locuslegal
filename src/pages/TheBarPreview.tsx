// Preview page — showcases all v1 question type renderers with sample data
// in both Answer and Review modes. No DB calls; pure UI demo.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, CheckCircle2 } from "lucide-react";
import { McqRenderer } from "@/components/bar/renderers/McqRenderer";
import { IssueSpotterRenderer } from "@/components/bar/renderers/IssueSpotterRenderer";
import { JurisdictionRenderer } from "@/components/bar/renderers/JurisdictionRenderer";
import { SpeedRoundRenderer } from "@/components/bar/renderers/SpeedRoundRenderer";
import { QUESTION_TYPE_LABELS } from "@/lib/bar/constants";
import { usePageMeta } from "@/hooks/usePageMeta";
import { RitChatPanel } from "@/components/bar/rit/RitChatPanel";

const STARTERS = {
  why: "Why isn't my answer correct?",
  cite: "Cite the leading case",
  hypo: "Give me a similar hypothetical",
} as const;

const SAMPLES = {
  mcq: {
    title: "Multiple Choice",
    difficulty: "easy" as const,
    area: "Constitutional",
    points: 5,
    prompt:
      "Under Article 21 of the Constitution of India, which of the following is NOT considered a component of the right to life and personal liberty as developed by the Supreme Court?",
    payload: {
      options: [
        { id: "a", text: "Right to a clean environment" },
        { id: "b", text: "Right to privacy" },
        { id: "c", text: "Right to free higher education for all adults" },
        { id: "d", text: "Right to a speedy trial" },
      ],
    },
    correctId: "c",
    explanation:
      "While the right to free education up to 14 years is guaranteed under Article 21A, the Supreme Court has not extended this to free higher education for all adults. The other options are recognised facets of Article 21.",
  },
  issue_spotter: {
    title: "Issue Spotter",
    difficulty: "medium" as const,
    area: "Contract",
    points: 15,
    prompt:
      "A, a 17-year-old, signs a contract to buy a motorcycle from B for ₹80,000. A pays ₹10,000 advance. B later sells the same motorcycle to C, who is unaware of the prior agreement. A also discovers B knew about a hidden engine defect. Identify ALL legal issues present.",
    payload: {
      issue_options: [
        { id: "i1", text: "Capacity to contract — minority of A under Section 11, Indian Contract Act, 1872" },
        { id: "i2", text: "Misrepresentation / fraud by B regarding the engine defect" },
        { id: "i3", text: "Specific performance — whether A can compel sale despite resale to C" },
        { id: "i4", text: "Bona fide purchaser for value without notice — protection of C" },
        { id: "i5", text: "Frustration of contract under Section 56" },
        { id: "i6", text: "Restitution of the ₹10,000 advance" },
      ],
    },
    correctIds: ["i1", "i2", "i4", "i6"],
    explanation:
      "Minor's contract is void ab initio (Mohori Bibee), so specific performance and frustration do not arise. Misrepresentation, the bona-fide purchaser doctrine, and restitution of the advance are all live issues.",
  },
  jurisdiction: {
    title: "Jurisdiction",
    difficulty: "medium" as const,
    area: "Procedure",
    points: 10,
    prompt:
      "A company registered in Mumbai enters into a contract with a supplier in Chennai. The contract is executed in Bengaluru and goods are to be delivered in Hyderabad. The supplier sues for non-payment. Which court has territorial jurisdiction under Section 20 CPC?",
    payload: {
      options: [
        {
          id: "a",
          jurisdiction: "Only the Bombay High Court",
          reasoning: "Defendant company has its registered office in Mumbai, so only Mumbai courts apply.",
        },
        {
          id: "b",
          jurisdiction: "Mumbai, Chennai, Bengaluru, or Hyderabad — plaintiff's choice",
          reasoning:
            "Under Section 20 CPC, suit may be filed where defendant resides/works for gain OR where cause of action wholly or partly arose. Each city satisfies one of these.",
        },
        {
          id: "c",
          jurisdiction: "Only Chennai (where supplier is based)",
          reasoning: "The plaintiff's place of business always determines jurisdiction.",
        },
        {
          id: "d",
          jurisdiction: "Only Hyderabad (place of delivery)",
          reasoning: "Delivery is the crux of cause of action and overrides residence.",
        },
      ],
    },
    correctId: "b",
    explanation:
      "Section 20 CPC gives the plaintiff a choice between defendant's residence/place of business and any place where the cause of action wholly or partly arose. All four cities qualify under one limb or the other.",
  },
  speed_round: {
    title: "Speed Round",
    difficulty: "hard" as const,
    area: "Criminal",
    points: 3,
    prompt: "Rapid-fire: identify the section of the Bharatiya Nyaya Sanhita, 2023 for each offence.",
    payload: {
      time_limit_seconds: 60,
      questions: [
        { id: "q1", prompt: "Murder", answer: "103" },
        { id: "q2", prompt: "Culpable homicide not amounting to murder", answer: "105" },
        { id: "q3", prompt: "Theft", answer: "303" },
        { id: "q4", prompt: "Cheating", answer: "318" },
        { id: "q5", prompt: "Criminal breach of trust", answer: "316" },
      ],
    },
  },
};

const DIFF_STYLES = {
  easy: "border-emerald-500/40 text-emerald-500",
  medium: "border-amber-500/40 text-amber-500",
  hard: "border-rose-500/40 text-rose-500",
} as const;

const DEMO_REPLIES: Record<keyof typeof SAMPLES, Record<string, string>> = {
  mcq: {
    [STARTERS.why]:
      "You picked **(a) Right to a clean environment**, but that *is* a recognised facet of Article 21 — see *Subhash Kumar v. State of Bihar* (1991) and the *M.C. Mehta* line of cases.\n\nThe odd-one-out is **(c) free higher education for all adults**. Article 21A guarantees free education only up to age 14. The Court has never read a generalised right to free higher education into Article 21.",
    [STARTERS.cite]:
      "- **Maneka Gandhi v. Union of India**, (1978) 1 SCC 248 — anchored the expansive reading of Article 21.\n- **Unni Krishnan v. State of A.P.**, (1993) 1 SCC 645 — defined the *limits* of the right to education within Article 21.",
    [STARTERS.hypo]:
      "A state government announces it will stop funding postgraduate seats in public universities. A petitioner claims this violates Article 21. **Will the petition succeed?** Reason from *Unni Krishnan* and Article 21A's textual ceiling at age 14.",
  },
  issue_spotter: {
    [STARTERS.why]:
      "You flagged **specific performance** as a live issue — but a minor's contract is **void *ab initio*** under *Mohori Bibee v. Dharmodas Ghose* (1903). There's no contract to specifically enforce, so that issue collapses.\n\nWhat *is* live: capacity (i1), B's fraudulent concealment (i2), C's bona-fide-purchaser protection (i4), and restitution of the ₹10,000 advance under Section 65 / equity (i6).",
    [STARTERS.cite]:
      "- **Mohori Bibee v. Dharmodas Ghose**, (1903) ILR 30 Cal 539 (PC) — minor's contract is void.\n- **Khan Gul v. Lakha Singh**, AIR 1928 Lah 609 — restitution where minor obtained benefit by fraud.",
    [STARTERS.hypo]:
      "A 16-year-old buys a laptop on EMI from a dealer who knows her age. She defaults after two months. **Can the dealer recover the laptop or sue for the balance?** Walk through capacity, restitution, and the equitable doctrine in *Khan Gul*.",
  },
  jurisdiction: {
    [STARTERS.why]:
      "You picked **(d) Only Hyderabad**, treating delivery as the sole anchor. Section 20 CPC is broader: the plaintiff has a *choice* between (i) where the defendant resides or carries on business, and (ii) any place where the cause of action arose **wholly or in part**.\n\nMumbai (defendant's office), Chennai, Bengaluru (execution), and Hyderabad (delivery) each satisfy one limb. So the answer is **(b)**.",
    [STARTERS.cite]:
      "- **A.B.C. Laminart v. A.P. Agencies**, (1989) 2 SCC 163 — leading case on splitting of cause of action under Section 20 CPC.\n- **Patel Roadways v. Prasad Trading**, (1991) 4 SCC 270 — interpretation of \"carries on business\" for corporations.",
    [STARTERS.hypo]:
      "A Delhi buyer orders machinery from a Pune seller; the contract is signed online, payment is made via a Bengaluru bank, and the machine is shipped to Kolkata. Seller sues for the price. **List every court with jurisdiction under Section 20 CPC and the limb that supports each.**",
  },
  speed_round: {
    [STARTERS.why]:
      "You missed **Q2** (culpable homicide not amounting to murder — BNS **§105**, you wrote 104) and **Q5** (criminal breach of trust — BNS **§316**, left blank).\n\n§104 is *causing death by negligence*. §105 covers culpable homicide that falls short of murder under one of the Exceptions to §101. Anchor §105 to the phrase *\"not amounting to murder\"*.",
    [STARTERS.cite]:
      "- **Reg v. Govinda**, (1876) ILR 1 Bom 342 — classic test distinguishing murder from culpable homicide.\n- **State of A.P. v. Rayavarapu Punnayya**, (1976) 4 SCC 382 — modern restatement of the murder/culpable-homicide line.",
    [STARTERS.hypo]:
      "A bank manager temporarily moves client deposits into his personal account to cover a margin call, intending to repay the next day. **Which BNS section applies and why?** Distinguish §316 (criminal breach of trust) from §303 (theft).",
  },
};

const DEMO_GREETINGS: Record<keyof typeof SAMPLES, string> = {
  mcq: "The correct answer is **(c)** — free higher education for all adults isn't a recognised facet of Article 21. What part would you like to dig into?",
  issue_spotter: "The live issues are capacity, fraud, bona-fide purchaser, and restitution — *not* specific performance or frustration. Where should we start?",
  jurisdiction: "Under Section 20 CPC the plaintiff has a choice across all four cities — answer **(b)**. Want me to walk through each limb?",
  speed_round: "You got 3/5. The two misses (§105 and §316) sit close to common look-alikes. Want me to break either one down?",
};

function PreviewShell({
  type,
  children,
}: {
  type: keyof typeof SAMPLES;
  children: (mode: "answer" | "review") => React.ReactNode;
}) {
  const s = SAMPLES[type];
  const [mode, setMode] = useState<"answer" | "review">("answer");

  return (
    <Card className="border-2 border-border p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">{QUESTION_TYPE_LABELS[type]}</Badge>
          <Badge variant="outline" className={`text-xs capitalize ${DIFF_STYLES[s.difficulty]}`}>
            {s.difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs">{s.area}</Badge>
          <Badge variant="outline" className="text-xs text-accent border-accent/40">
            {s.points} pts
          </Badge>
        </div>
        <div className="flex gap-1 rounded-md border-2 border-border p-1">
          <Button
            size="sm"
            variant={mode === "answer" ? "default" : "ghost"}
            onClick={() => setMode("answer")}
            className="gap-1.5 h-7 px-2.5 text-xs"
          >
            <Eye size={12} /> Answer
          </Button>
          <Button
            size="sm"
            variant={mode === "review" ? "default" : "ghost"}
            onClick={() => setMode("review")}
            className="gap-1.5 h-7 px-2.5 text-xs"
          >
            <CheckCircle2 size={12} /> Review
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold font-heading mb-2">{s.title}</h2>
        <p className="text-sm text-foreground leading-relaxed">{s.prompt}</p>
      </div>

      <div className="pt-2 border-t border-border">{children(mode)}</div>

      {mode === "review" && "explanation" in s && s.explanation && (
        <div className="p-4 bg-accent/5 border-2 border-accent/30 rounded-lg">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-1">
            Explanation
          </div>
          <p className="text-sm text-foreground leading-relaxed">{s.explanation}</p>
        </div>
      )}

      {mode === "review" && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground italic">
            Demo mode — replies are canned. The real tutor uses your actual attempt.
          </p>
          <RitChatPanel
            demoMode
            attemptId="preview"
            challenge={{ title: s.title, question_type: type }}
            greeting={DEMO_GREETINGS[type]}
            demoReplies={DEMO_REPLIES[type]}
          />
        </div>
      )}
    </Card>
  );
}

function McqPreview() {
  const s = SAMPLES.mcq;
  const [val, setVal] = useState("");
  return (
    <PreviewShell type="mcq">
      {(mode) =>
        mode === "answer" ? (
          <McqRenderer mode="answer" payload={s.payload} value={val} onChange={setVal} />
        ) : (
          <McqRenderer
            mode="review"
            payload={s.payload}
            submittedId="a"
            correctId={s.correctId}
          />
        )
      }
    </PreviewShell>
  );
}

function IssueSpotterPreview() {
  const s = SAMPLES.issue_spotter;
  const [sel, setSel] = useState<string[]>([]);
  return (
    <PreviewShell type="issue_spotter">
      {(mode) =>
        mode === "answer" ? (
          <IssueSpotterRenderer mode="answer" payload={s.payload} selected={sel} onChange={setSel} />
        ) : (
          <IssueSpotterRenderer
            mode="review"
            payload={s.payload}
            submittedIds={["i1", "i2", "i3"]}
            correctIds={s.correctIds}
          />
        )
      }
    </PreviewShell>
  );
}

function JurisdictionPreview() {
  const s = SAMPLES.jurisdiction;
  const [val, setVal] = useState("");
  return (
    <PreviewShell type="jurisdiction">
      {(mode) =>
        mode === "answer" ? (
          <JurisdictionRenderer mode="answer" payload={s.payload} value={val} onChange={setVal} />
        ) : (
          <JurisdictionRenderer
            mode="review"
            payload={s.payload}
            submittedId="d"
            correctId={s.correctId}
          />
        )
      }
    </PreviewShell>
  );
}

function SpeedRoundPreview() {
  const s = SAMPLES.speed_round;
  const [done, setDone] = useState(false);
  return (
    <PreviewShell type="speed_round">
      {(mode) =>
        mode === "answer" ? (
          done ? (
            <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Demo round complete. Switch to <strong>Review</strong> to see results, or reset to try again.
              </p>
              <Button size="sm" variant="outline" onClick={() => setDone(false)}>
                Reset demo
              </Button>
            </div>
          ) : (
            <SpeedRoundRenderer
              mode="answer"
              payload={s.payload}
              onComplete={() => setDone(true)}
            />
          )
        ) : (
          <SpeedRoundRenderer
            mode="review"
            perQuestion={s.payload.questions.map((q, i) => ({
              id: q.id,
              prompt: q.prompt,
              submitted: i === 1 ? "104" : i === 4 ? "" : q.answer,
              correct: q.answer,
              got_right: i !== 1 && i !== 4,
            }))}
          />
        )
      }
    </PreviewShell>
  );
}

export default function TheBarPreview() {
  usePageMeta({
    title: "Question Type Preview — The Bar",
    description: "Preview all question formats supported on The Bar: MCQ, Issue Spotter, Jurisdiction, and Speed Round.",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          to="/the-bar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> Back to The Bar
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight mb-3">
            Question Type{" "}
            <span className="text-accent">Preview</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            A live tour of every question format on The Bar. Toggle between{" "}
            <strong className="text-foreground">Answer</strong> and{" "}
            <strong className="text-foreground">Review</strong> modes to see how
            a student attempts each type — and how feedback is shown after submission.
          </p>
        </div>

        <Tabs defaultValue="mcq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="mcq" className="text-xs md:text-sm py-2">MCQ</TabsTrigger>
            <TabsTrigger value="issue_spotter" className="text-xs md:text-sm py-2">Issue Spotter</TabsTrigger>
            <TabsTrigger value="jurisdiction" className="text-xs md:text-sm py-2">Jurisdiction</TabsTrigger>
            <TabsTrigger value="speed_round" className="text-xs md:text-sm py-2">Speed Round</TabsTrigger>
          </TabsList>

          <TabsContent value="mcq"><McqPreview /></TabsContent>
          <TabsContent value="issue_spotter"><IssueSpotterPreview /></TabsContent>
          <TabsContent value="jurisdiction"><JurisdictionPreview /></TabsContent>
          <TabsContent value="speed_round"><SpeedRoundPreview /></TabsContent>
        </Tabs>

        <div className="mt-10 p-5 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
          <strong className="text-foreground">Coming next:</strong> Document Review, Brief Builder,
          Ethics, and Client Counseling formats are reserved for post-v1 and not yet wired.
        </div>
      </div>
    </div>
  );
}
