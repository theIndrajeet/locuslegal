import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Download, Clock, Users, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Audience = "Students" | "Firms" | "Institutions";
type Filter = "All" | Audience;

interface GuideAttachment {
  label: string;
  href: string;
  comingSoon?: boolean;
}

interface Guide {
  id: string;
  caseNumber: string;
  title: string;
  audience: Audience;
  stage: string;
  readTime: string;
  slug: string;
  sections: string[];
  pdfHref?: string;
  attachments?: GuideAttachment[];
}




const guides: Guide[] = [
  {
    id: "1", caseNumber: "LX-001", title: "How to Cold Email a Law Firm (And Actually Get a Reply)",
    audience: "Students", stage: "Before You Apply", readTime: "6 min", slug: "cold-email-law-firm",
    sections: ["Why most cold emails fail", "Finding the right contact", "Writing the subject line", "The email structure", "Following up"],
    pdfHref: "/documents/LX-001-ColdEmail.pdf",
    attachments: [
      { label: "Cold Email Template", href: "/documents/CoverLetterTemplate.docx" },
      { label: "Follow-up Email Template", href: "/documents/FollowupEmailTemplate.docx" },
    ],
  },
  {
    id: "2", caseNumber: "LX-002", title: "The Non-NLU Student's Guide to Getting Top Firm Internships",
    audience: "Students", stage: "Before You Apply", readTime: "8 min", slug: "non-nlu-student-guide",
    sections: ["Reframing the disadvantage", "What firms actually look for", "Building your portfolio", "Direct application strategy", "Making it stick"],
    pdfHref: "/documents/LX-002-NonNLU.pdf",
    attachments: [
      { label: "Internship Application Tracker", href: "/documents/InternshipApplicationTracker.xlsx" },
      { label: "LinkedIn Profile Checklist", href: "/documents/LinkedInProfileChecklist.docx" },
    ],
  },
  {
    id: "3", caseNumber: "LX-003", title: "What to Expect in Your First Legal Internship",
    audience: "Students", stage: "Once You're In", readTime: "5 min", slug: "first-legal-internship",
    sections: ["Day one — what actually happens", "Types of work you'll be given", "How to ask questions properly", "Tracking your work", "End-of-internship checklist"],
    pdfHref: "/documents/LX-003-FirstInternship.pdf",
    attachments: [
      { label: "Monthly Internship Log", href: "/documents/MonthlyInternshipLog.docx" },
      { label: "First Day Checklist", href: "/documents/FirstDayChecklist.docx" },
    ],
  },
  {
    id: "4", caseNumber: "LX-004", title: "How to Write a Legal Research Memo",
    audience: "Students", stage: "Once You're In", readTime: "7 min", slug: "legal-research-memo",
    sections: ["What a memo is and isn't", "Structure: IRAC explained", "Research methodology", "Writing style and tone", "Common mistakes"],
    pdfHref: "/documents/LX-004-ResearchMemo.pdf",
    attachments: [
      { label: "Legal Research Memo Template", href: "/documents/LegalResearchMemoTemplate.docx" },
      { label: "Sample IRAC Memo", href: "/documents/SampleIRACMemo.docx" },
    ],
  },
  {
    id: "5", caseNumber: "LX-005", title: "How to Convert an Internship into a PPO",
    audience: "Students", stage: "After It Ends", readTime: "5 min", slug: "convert-internship-ppo",
    sections: ["What firms look for in interns", "The visibility strategy", "Asking for feedback", "The follow-up timeline", "Writing the PPO request"],
    pdfHref: "/documents/LX-005-ConvertPPO.pdf",
    attachments: [
      { label: "Thank You Email Template", href: "/documents/ThankYouEmailTemplate.docx" },
      { label: "NOC Request Letter Template", href: "/documents/NOCRequestLetterTemplate.docx" },
    ],
  },
  {
    id: "6", caseNumber: "LX-006", title: "How to Network as a Law Student in India",
    audience: "Students", stage: "Before You Apply", readTime: "4 min", slug: "network-law-student",
    sections: ["Why most law students network wrong", "LinkedIn vs in-person", "Reaching out to seniors", "Conference strategy", "Maintaining relationships"],
  },
  {
    id: "7", caseNumber: "LX-007", title: "Practice Area Guide: What Each Area Actually Looks Like Day-to-Day",
    audience: "Students", stage: "Before You Apply", readTime: "6 min", slug: "practice-area-guide",
    sections: ["Corporate", "Litigation", "IP", "Tax", "Employment", "How to choose"],
  },
  {
    id: "8", caseNumber: "LX-008", title: "Bar Council Registration Guide for Final Year Students",
    audience: "Students", stage: "After It Ends", readTime: "5 min", slug: "bar-council-registration",
    sections: ["Eligibility requirements", "Documents checklist", "State Bar Council vs BCI", "Timeline", "Common errors"],
  },
  {
    id: "9", caseNumber: "LX-009", title: "How to Evaluate a Law Intern",
    audience: "Firms", stage: "Firm Resources", readTime: "4 min", slug: "evaluate-law-intern",
    sections: ["Setting clear expectations", "The evaluation rubric", "Mid-internship check-in", "Final assessment criteria", "Giving useful feedback"],
    attachments: [
      { label: "Intern Evaluation Rubric", href: "/documents/InternEvaluationRubric.docx" },
      { label: "Intern Daily Task Sheet", href: "/documents/InternDailyTaskSheet.docx" },
      { label: "Intern Feedback Form", href: "/documents/InternFeedbackForm.docx" },
    ],
  },
  {
    id: "10", caseNumber: "LX-010", title: "Building Your Firm's Internship Program from Scratch",
    audience: "Firms", stage: "Firm Resources", readTime: "6 min", slug: "build-internship-program",
    sections: ["Why a structured program matters", "Setting intake criteria", "Onboarding checklist", "Assigning work effectively", "Retention and conversion"],
    attachments: [
      { label: "Internship Offer Letter Template", href: "/documents/InternshipOfferLetterTemplate.docx" },
      { label: "Intern NDA Template", href: "/documents/InternNDATemplate.docx" },
      { label: "Internship Certificate Template", href: "/documents/InternshipCertificateTemplate.docx" },
    ],
  },
  {
    id: "11", caseNumber: "LX-011", title: "What to Look for in a Law Intern's CV",
    audience: "Firms", stage: "Firm Resources", readTime: "4 min", slug: "law-intern-cv",
    sections: ["Red flags vs green flags", "Academic record weight", "Extracurriculars that matter", "Writing samples", "What to ignore"],
    attachments: [
      { label: "CV Screening Checklist", href: "#", comingSoon: true },
    ],
  },
  {
    id: "12", caseNumber: "LX-012", title: "How to Post Your Firm on Locus",
    audience: "Firms", stage: "Firm Resources", readTime: "3 min", slug: "post-firm-locus",
    sections: ["Creating your firm profile", "Adding internship listings", "Setting intake criteria", "Managing applications", "Getting verified"],
  },
  {
    id: "13", caseNumber: "LX-013", title: "How to Set Up a Placement Cell",
    audience: "Institutions", stage: "Institution Resources", readTime: "7 min", slug: "setup-placement-cell",
    sections: ["What a placement cell actually does", "Core team structure", "Building a firm database", "Student preparation pipeline", "Tracking placements"],
    attachments: [
      { label: "Placement Cell Structure Template", href: "#", comingSoon: true },
      { label: "Firm Database Format", href: "#", comingSoon: true },
    ],
  },
  {
    id: "14", caseNumber: "LX-014", title: "How to Register Your Institution on Locus",
    audience: "Institutions", stage: "Institution Resources", readTime: "5 min", slug: "register-institution-locus",
    sections: ["Eligibility", "Documents needed", "Verification process", "What you get access to", "Managing your student roster"],
    attachments: [
      { label: "Institution Registration Guide", href: "#", comingSoon: true },
    ],
  },
];

const filters: Filter[] = ["All", "Students", "Firms", "Institutions"];

const audienceTagStyles: Record<Audience, string> = {
  Students: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Firms: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Institutions: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function Playbook() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "The Locus Playbook — Guides & Resources | Locus by LexRoot";
  }, []);

  const filtered = guides.filter(
    (g) => activeFilter === "All" || g.audience === activeFilter
  );

  const selected = guides.find((g) => g.id === selectedId) || null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(true);
  };

  // Mobile detail view
  if (isMobile && mobileDetailOpen && selected) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 pb-8">
        <button
          onClick={() => setMobileDetailOpen(false)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to guides
        </button>
        <GuideDetail guide={selected} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Panel */}
        <div
          className={`${
            isMobile ? "w-full" : "w-[300px] min-w-[300px]"
          } border-r border-border/50 flex flex-col`}
        >
          <div className="p-5 pb-3">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-4">
              The Locus Playbook
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFilter(f);
                    setSelectedId(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilter === f
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelect(g.id)}
                className={`w-full text-left px-5 py-3.5 border-l-2 transition-all hover:bg-muted/30 ${
                  selectedId === g.id
                    ? "border-l-accent bg-muted/20"
                    : "border-l-transparent"
                }`}
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {g.caseNumber}
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
                  {g.title}
                </p>
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${audienceTagStyles[g.audience]}`}
                >
                  {g.audience}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel (desktop only) */}
        {!isMobile && (
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="p-8 max-w-3xl">
                <GuideDetail guide={selected} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full relative overflow-hidden">
                {/* Gold radial gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(45_100%_51%/0.1)_0%,_transparent_60%)]" />

                <div className="relative z-10 flex flex-col items-start px-12 max-w-2xl">
                  {/* Case file label */}
                  <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#D4A017]/60 animate-fade-in" style={{ animationFillMode: 'both' }}>
                    CASE FILE SYSTEM // LX-000
                  </span>

                  {/* Massive heading */}
                  <h2 className="text-5xl md:text-6xl font-bold mt-4 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                    The Locus <span className="text-[#D4A017]">Playbook</span>
                  </h2>

                  {/* Animated gold bar */}
                  <div className="h-1.5 w-32 bg-[#D4A017] rounded-full mt-6 mb-6 animate-fade-in origin-left" style={{ animationDelay: '300ms', animationFillMode: 'both' }} />

                  {/* Tagline */}
                  <p className="text-lg text-muted-foreground/90 mb-12 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                    Your case file system for navigating legal internships in India.
                  </p>

                  {/* Feature cards — left-aligned with gold border */}
                  <div className="flex flex-col gap-4 w-full mb-14">
                    {[
                      { icon: BookOpen, label: "14 Guides", desc: "Covering every stage from application to PPO conversion" },
                      { icon: Users, label: "3 Audiences", desc: "Tailored for students, firms, and institutions" },
                      { icon: Layers, label: "Actionable", desc: "Step-by-step sections you can use right away" },
                    ].map((item, i) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-6 border-l-2 border-l-[#D4A017] animate-fade-in"
                        style={{ animationDelay: `${500 + i * 150}ms`, animationFillMode: 'both' }}
                      >
                        <item.icon className="w-8 h-8 text-[#D4A017] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-base font-semibold text-foreground block">{item.label}</span>
                          <span className="text-sm text-muted-foreground leading-relaxed">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prompt with pulsing dot */}
                  <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '950ms', animationFillMode: 'both' }}>
                    <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
                    <p className="text-base font-semibold text-[#D4A017]">
                      Select a guide from the left panel to get started
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideDetail({ guide }: { guide: Guide }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasPreview = !!guide.pdfHref;

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-1">
            {guide.caseNumber} · {guide.stage}
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {guide.title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasPreview ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setPreviewOpen(true)}
              >
                <BookOpen size={14} /> Read Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = guide.pdfHref!;
                  link.download = guide.pdfHref!.split("/").pop() || "guide.pdf";
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download size={14} /> Download PDF
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 opacity-50 cursor-not-allowed"
                disabled
              >
                <BookOpen size={14} /> Read Guide — Coming Soon
              </Button>
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <Download size={14} /> Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-8 mb-6">
        {[
          { label: "Audience", value: guide.audience, icon: Users },
          { label: "Read Time", value: guide.readTime, icon: Clock },
          { label: "Stage", value: guide.stage, icon: Layers },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <m.icon size={10} /> {m.label}
            </p>
            <p className="text-sm font-medium text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/50 mb-6" />

      {/* Sections */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          What's inside
        </h2>
        <div className="space-y-2">
          {guide.sections.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card/50"
            >
              <span className="font-mono text-sm text-accent font-bold w-6 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      {guide.attachments && guide.attachments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Attachments
          </h2>
          <div className="space-y-2">
            {guide.attachments.map((att, i) =>
              att.comingSoon ? (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 opacity-60"
                >
                  <Download size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">{att.label}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
              ) : (
                <button
                  key={i}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = att.href;
                    link.download = att.href.split("/").pop() || att.label;
                    link.target = "_blank";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-accent/40 hover:bg-accent/5 transition-all group w-full text-left"
                >
                  <Download size={16} className="text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{att.label}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={(open) => !open && setPreviewOpen(false)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="font-heading">
              {guide.caseNumber} — {guide.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 h-[calc(85vh-4rem)]">
            <iframe
              src={guide.pdfHref}
              title={guide.title}
              className="w-full h-full rounded-lg border border-border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
