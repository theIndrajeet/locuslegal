import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FileText, Download, ScanSearch, CalendarCheck, Eye } from "lucide-react";
import { useFeatureVotes } from "@/hooks/useFeatureVotes";
import { FeatureVoteButton } from "@/components/FeatureVoteButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const resources = [
  {
    title: "Demo CV",
    description:
      "Download a professionally formatted legal CV template tailored for law students and early-career lawyers.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "cv" as const,
    downloadHref: "/documents/IdealCVTemplate.docx",
    previewPages: [1, 2],
    previewPrefix: "/documents/cv-page-",
  },
  {
    title: "Cold Email Template",
    description:
      "A ready-to-use cold email template for reaching out to law firms for internship opportunities — just fill in the placeholders.",
    icon: Download,
    comingSoon: false,
    hasPreview: true,
    previewKey: "cl" as const,
    downloadHref: "/documents/CoverLetterTemplate.docx",
    previewPages: [1, 2],
    previewPrefix: "/documents/cl-page-",
  },
  {
    title: "Follow-up Email Template",
    description:
      "A professional follow-up email template to send after your internship application — stay on their radar without being pushy.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "followup" as const,
    downloadHref: "/documents/FollowupEmailTemplate.docx",
    previewPages: [1, 2],
    previewPrefix: "/documents/FollowupEmailTemplate-page-",
  },
  {
    title: "Thank You Email Template",
    description:
      "Send a polished thank-you email after interviews or internship completions — leaves a lasting impression.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "thankyou" as const,
    downloadHref: "/documents/ThankYouEmailTemplate.docx",
    previewPages: [1, 2],
    previewPrefix: "/documents/ThankYouEmailTemplate-page-",
  },
  {
    title: "NOC Request Letter Template",
    description:
      "A formal No Objection Certificate request letter for your college — ready to customise and submit.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "noc" as const,
    downloadHref: "/documents/NOCRequestLetterTemplate.docx",
    previewPages: [1, 2, 3],
    previewPrefix: "/documents/NOCRequestLetterTemplate-page-",
  },
  {
    title: "Internship Application Tracker",
    description:
      "An Excel tracker to organise all your internship applications — firms, dates, statuses, and follow-ups in one place.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "tracker" as const,
    downloadHref: "/documents/InternshipApplicationTracker.xlsx",
    previewPages: [1, 2, 3],
    previewPrefix: "/documents/InternshipApplicationTracker-page-",
    previewPadded: true,
  },
  {
    title: "Monthly Internship Log",
    description:
      "Track your daily tasks, learnings, and supervisor feedback throughout your internship month by month.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "log" as const,
    downloadHref: "/documents/MonthlyInternshipLog.docx",
    previewPages: [1, 2, 3, 4],
    previewPrefix: "/documents/MonthlyInternshipLog-page-",
  },
  {
    title: "LinkedIn Profile Checklist",
    description:
      "A step-by-step checklist to optimise your LinkedIn profile for legal recruiters and firm partners.",
    icon: FileText,
    comingSoon: false,
    hasPreview: true,
    previewKey: "linkedin" as const,
    downloadHref: "/documents/LinkedInProfileChecklist.docx",
    previewPages: [1, 2, 3],
    previewPrefix: "/documents/LinkedInProfileChecklist-page-",
  },
  {
    title: "CV Analyser",
    description:
      "Get AI-powered feedback on your legal CV — structure, keywords, formatting, and content suggestions.",
    icon: ScanSearch,
    action: "Coming Soon",
    comingSoon: true,
    hasPreview: false,
  },
  {
    title: "Book Your Session",
    description:
      "Schedule a 1-on-1 mentoring session with practicing lawyers and industry professionals.",
    icon: CalendarCheck,
    action: "Coming Soon",
    comingSoon: true,
    hasPreview: false,
  },
];

export default function Resources() {
  usePageMeta({ title: "Resources", description: "CV templates, cold email scripts, trackers, and mentorship for law students building their legal career in India.", path: "/resources" });
  const [previewResource, setPreviewResource] = useState<string | null>(null);
  const { voteCounts, hasVoted, toggleVote } = useFeatureVotes();
  const activeResource = resources.find((r) => r.hasPreview && r.previewKey === previewResource);

  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 md:px-8 mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Resources to Build Your{" "}
          <span className="text-accent">Legal Career</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Templates, tools, and mentorship to help you stand out in the legal
          industry.
        </p>
      </section>

      {/* Cards */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {resources.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="group relative bg-card border border-border/50 rounded-2xl p-8 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              >
                {r.comingSoon && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <Icon className="text-accent" size={24} />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">
                  {r.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {r.description}
                </p>

                {r.hasPreview ? (
                  <div className="flex gap-3">
                    <a
                      href={r.downloadHref}
                      download
                      className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all"
                    >
                      <Download size={16} />
                      Download
                    </a>
                    <button
                      onClick={() => setPreviewResource(r.previewKey!)}
                      className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-all"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      disabled={r.comingSoon}
                      className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {r.action}
                    </button>
                    {r.comingSoon && (
                      <FeatureVoteButton
                        featureKey={`resource-${r.title.toLowerCase().replace(/\s+/g, '-')}`}
                        count={voteCounts[`resource-${r.title.toLowerCase().replace(/\s+/g, '-')}`] || 0}
                        voted={hasVoted(`resource-${r.title.toLowerCase().replace(/\s+/g, '-')}`)}
                        onToggle={toggleVote}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={(open) => !open && setPreviewResource(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="font-heading">
              {activeResource?.title} — Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 h-[calc(85vh-4rem)] overflow-y-auto space-y-4">
            {activeResource?.previewPages?.map((page) => {
              const padded = (activeResource as any).previewPadded;
              const pageStr = padded ? String(page).padStart(2, "0") : String(page);
              return (
                <img
                  key={page}
                  src={`${activeResource.previewPrefix}${pageStr}.jpg`}
                  alt={`${activeResource.title} page ${page}`}
                  className="w-full rounded-lg border border-border"
                />
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
