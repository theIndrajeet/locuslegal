import { useState } from "react";
import { FileText, Download, ScanSearch, CalendarCheck, Eye } from "lucide-react";
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
  },
  {
    title: "Cover Letter Template",
    description:
      "A well-structured cover letter template designed for applications to law firms, chambers, and corporate legal teams.",
    icon: Download,
    action: "Download",
    comingSoon: false,
    hasPreview: false,
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
  const [previewOpen, setPreviewOpen] = useState(false);

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
                      href="/documents/IdealCVTemplate.docx"
                      download
                      className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all"
                    >
                      <Download size={16} />
                      Download
                    </a>
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-all"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={r.comingSoon}
                    className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {r.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="font-heading">
              Demo CV — Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 h-[calc(85vh-4rem)] overflow-y-auto space-y-4">
            {[1, 2].map((page) => (
              <img
                key={page}
                src={`/documents/cv-page-${page}.jpg`}
                alt={`CV Template page ${page}`}
                className="w-full rounded-lg border border-border"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
