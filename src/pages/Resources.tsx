import { FileText, Download, ScanSearch, CalendarCheck } from "lucide-react";

const resources = [
  {
    title: "Demo CV",
    description: "Download a professionally formatted legal CV template tailored for law students and early-career lawyers.",
    icon: FileText,
    action: "Download",
    comingSoon: false,
  },
  {
    title: "Cover Letter Template",
    description: "A well-structured cover letter template designed for applications to law firms, chambers, and corporate legal teams.",
    icon: Download,
    action: "Download",
    comingSoon: false,
  },
  {
    title: "CV Analyser",
    description: "Get AI-powered feedback on your legal CV — structure, keywords, formatting, and content suggestions.",
    icon: ScanSearch,
    action: "Coming Soon",
    comingSoon: true,
  },
  {
    title: "Book Your Session",
    description: "Schedule a 1-on-1 mentoring session with practicing lawyers and industry professionals.",
    icon: CalendarCheck,
    action: "Coming Soon",
    comingSoon: true,
  },
];

export default function Resources() {
  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 md:px-8 mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Resources to Build Your{" "}
          <span className="text-accent">Legal Career</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Templates, tools, and mentorship to help you stand out in the legal industry.
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
                <h3 className="font-heading text-xl font-bold mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {r.description}
                </p>
                <button
                  disabled={r.comingSoon}
                  className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {r.action}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
