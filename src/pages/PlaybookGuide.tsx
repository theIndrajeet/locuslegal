import { useEffect, useMemo, useRef } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, ArrowRight, Clock, Download, Layers, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getGuideBySlug, getNextGuide, type Audience } from "@/content/playbook";
import { mdxComponents } from "@/components/playbook/mdx/mdxComponents";
import { ReaderTOC, type TocItem } from "@/components/playbook/ReaderTOC";
import { ReaderProgressBar } from "@/components/playbook/ReaderProgressBar";
import { MarkCompleteButton } from "@/components/playbook/MarkCompleteButton";
import { usePlaybookProgress } from "@/hooks/usePlaybookProgress";
import { Button } from "@/components/ui/button";

const audienceTagStyles: Record<Audience, string> = {
  Students: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Firms: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Institutions: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function PlaybookGuide() {
  const { slug } = useParams<{ slug: string }>();
  const articleRef = useRef<HTMLElement>(null);
  const guide = slug ? getGuideBySlug(slug) : null;
  const nextGuide = slug ? getNextGuide(slug) : null;
  const { userId, getStatus, markStarted, toggleComplete } = usePlaybookProgress();

  usePageMeta({
    title: guide ? `${guide.title} — The Playbook` : "Playbook",
    description: guide
      ? `Read ${guide.title} on Locus — a practical guide for ${guide.audience.toLowerCase()}.`
      : undefined,
    path: slug ? `/playbook/${slug}` : "/playbook",
  });

  // Mark as started when opened (logged-in only)
  useEffect(() => {
    if (userId && slug && guide) {
      markStarted(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, slug]);

  // Scroll to top when slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  // Build TOC from guide's sections (each section becomes an h2 in MDX with matching slug)
  const tocItems: TocItem[] = useMemo(() => {
    if (!guide) return [];
    return guide.sections.map((s) => ({
      id: slugify(s),
      text: s,
      level: 2,
    }));
  }, [guide]);

  if (!slug) return <Navigate to="/playbook" replace />;
  if (!guide) {
    return (
      <div className="min-h-screen bg-background pt-24 px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-mono text-xs text-muted-foreground mb-2">404 · GUIDE NOT FOUND</p>
          <h1 className="text-2xl font-bold mb-3">This guide isn't published yet</h1>
          <p className="text-sm text-muted-foreground mb-6">
            It may be on the way — check back soon, or browse the rest of the Playbook.
          </p>
          <Link to="/playbook">
            <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ArrowLeft size={14} /> Back to Playbook
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = getStatus(slug);
  const completed = status === "completed";
  const Article = guide.Component;

  return (
    <div className="min-h-screen bg-background">
      <ReaderProgressBar targetRef={articleRef} />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
          {/* Left rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <Link
                to="/playbook"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={11} /> Back to Playbook
              </Link>

              <div className="h-px bg-border/60" />

              <div className="space-y-2">
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground block">
                  {guide.caseNumber}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${audienceTagStyles[guide.audience]}`}
                >
                  {guide.audience}
                </span>
              </div>

              <div className="h-px bg-border/60" />

              <ReaderTOC items={tocItems} />

              {userId && (
                <>
                  <div className="h-px bg-border/60" />
                  <MarkCompleteButton
                    completed={completed}
                    onToggle={() => toggleComplete(slug)}
                  />
                </>
              )}
            </div>
          </aside>

          {/* Article */}
          <article ref={articleRef} className="min-w-0 w-full lg:border lg:border-dashed lg:border-border lg:rounded-lg lg:p-10">
            {/* Mobile back */}
            <Link
              to="/playbook"
              className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft size={12} /> Back to Playbook
            </Link>

            {/* Mobile case meta */}
            <div className="lg:hidden flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                {guide.caseNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${audienceTagStyles[guide.audience]}`}
              >
                {guide.audience}
              </span>
            </div>

            <header className="mb-8">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                {guide.stage}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                {guide.title}
              </h1>
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} /> {guide.readTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={12} /> {guide.sections.length} sections
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} /> {guide.audience}
                </span>
              </div>
            </header>

            <div className="playbook-prose">
              <MDXProvider components={mdxComponents}>
                <Article />
              </MDXProvider>
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-border space-y-8">
              {/* Mobile mark-complete */}
              {userId && (
                <div className="lg:hidden">
                  <MarkCompleteButton
                    completed={completed}
                    onToggle={() => toggleComplete(slug)}
                  />
                </div>
              )}

              {/* Attachments */}
              {guide.attachments && guide.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Templates &amp; resources
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {guide.attachments.map((a) => (
                      <a
                        key={a.label}
                        href={a.comingSoon ? "#" : a.href}
                        download={a.comingSoon ? undefined : true}
                        target={a.comingSoon ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => a.comingSoon && e.preventDefault()}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-card text-sm transition-all ${
                          a.comingSoon
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-accent/60 hover:bg-card/80"
                        }`}
                      >
                        <span className="text-foreground">{a.label}</span>
                        {a.comingSoon ? (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Soon
                          </span>
                        ) : (
                          <Download size={14} className="text-muted-foreground shrink-0" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Next + PDF */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {nextGuide ? (
                  <Link
                    to={`/playbook/${nextGuide.slug}`}
                    className="group flex items-center gap-3 text-sm"
                  >
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                        Next guide
                      </span>
                      <span className="block text-foreground font-semibold group-hover:text-accent transition-colors">
                        {nextGuide.title}
                      </span>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                ) : (
                  <span />
                )}

                {guide.pdfHref && (
                  <a
                    href={guide.pdfHref}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download size={11} /> Prefer PDF? Download
                  </a>
                )}
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
