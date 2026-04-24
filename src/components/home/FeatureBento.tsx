import { Link } from "react-router-dom";
import { Building2, Swords, BookOpen, FileText, Wrench, ListChecks, UserCircle2, ArrowUpRight } from "lucide-react";

type Tile = {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  className: string;
  badge?: string;
};

const tiles: Tile[] = [
  {
    title: "Directory",
    desc: "Search 3,890+ law firms, chambers, and companies across India. Filter by city, practice area, and size. Compare up to 3 side-by-side.",
    href: "/directory",
    icon: Building2,
    className: "md:col-span-2 md:row-span-2",
    badge: "Flagship",
  },
  {
    title: "The Bar",
    desc: "Daily skill challenges across 8 formats. Climb the leaderboard. Prove yourself on merit — not marks.",
    href: "/the-bar",
    icon: Swords,
    className: "md:col-span-2 md:row-span-2",
    badge: "Locus+",
  },
  {
    title: "Playbook",
    desc: "Field-tested guides for cold emails, interviews, and your first internship.",
    href: "/playbook",
    icon: BookOpen,
    className: "md:col-span-2",
  },
  {
    title: "Resources",
    desc: "8 career templates — CVs, cold-email scripts, research memos. Download free.",
    href: "/resources",
    icon: FileText,
    className: "md:col-span-1",
  },
  {
    title: "Tools",
    desc: "10 legal tools — NDA, DPA, and internship contract generators included.",
    href: "/tools",
    icon: Wrench,
    className: "md:col-span-1",
  },
  {
    title: "Tracker",
    desc: "Log every application. See where you stand. Get nudged on stale follow-ups.",
    href: "/applications",
    icon: ListChecks,
    className: "md:col-span-2",
  },
  {
    title: "Public Profile",
    desc: "A merit-first profile firms actually want to read. Built from your work, not your campus.",
    href: "/profile/edit",
    icon: UserCircle2,
    className: "md:col-span-2",
  },
];

export default function FeatureBento() {
  return (
    <section id="features" className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="font-heading text-sm tracking-widest uppercase text-accent mb-3">What's inside</p>
          <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            One platform. Every tool that matters.
          </h2>
          <p className="mt-4 text-foreground/70 max-w-2xl mx-auto">
            Locus pulls together the directory, the practice, the templates, and the tracker — so you stop juggling tabs and start shipping work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[180px] gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                to={t.href}
                className={`group relative flex flex-col justify-between p-6 bg-card border-2 border-border rounded-xl shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_0_hsl(var(--accent))] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 ${t.className}`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-accent/15 border border-accent/30">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex items-center gap-2">
                    {t.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent text-accent-foreground">
                        {t.badge}
                      </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-xl md:text-2xl font-extrabold text-foreground mb-2">
                    {t.title}
                  </h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">{t.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
