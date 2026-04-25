import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { guides, type Audience } from "@/content/playbook";
import { GuideCard } from "@/components/playbook/GuideCard";
import { usePlaybookProgress } from "@/hooks/usePlaybookProgress";

type Filter = "All" | Audience;
const filters: Filter[] = ["All", "Students", "Firms", "Institutions"];

export default function Playbook() {
  usePageMeta({
    title: "The Playbook",
    description:
      "Step-by-step guides for law students, firms, and institutions — from landing internships to running legal ops. Read on Locus.",
    path: "/playbook",
  });

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const { userId, getStatus } = usePlaybookProgress();

  const filtered = guides.filter(
    (g) => activeFilter === "All" || g.audience === activeFilter
  );

  const publishedCount = guides.filter((g) => !g.comingSoon).length;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            CASE FILE SYSTEM
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            The Locus <span className="text-accent">Playbook</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            A growing course on the legal internship game in India — read on the
            site, no downloads required. {publishedCount} guides live, more
            coming each week.
          </p>
        </header>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                activeFilter === f
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GuideCard
              key={g.slug}
              guide={g}
              status={getStatus(g.slug)}
              showStatus={!!userId}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No guides for this filter yet.
          </div>
        )}
      </div>
    </div>
  );
}
