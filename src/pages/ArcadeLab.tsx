import { useEffect } from "react";
import Lockbox from "@/components/arcade-lab/Lockbox";
import Objection from "@/components/arcade-lab/Objection";
import StampSort from "@/components/arcade-lab/StampSort";

const GAMES = [
  {
    id: "lockbox",
    name: "Lex's Lockbox",
    tagline: "3-digit dial. Crack the brief.",
    notes: "Quickest. Pure tactile satisfaction. No vocabulary barrier.",
    Component: Lockbox,
  },
  {
    id: "objection",
    name: "Objection!",
    tagline: "5-letter legal term. Six tries.",
    notes: "Habit hook. Highest replay value. Brand-aligned.",
    Component: Objection,
  },
  {
    id: "stamp",
    name: "Stamp Sort",
    tagline: "File each Exhibit to the right pile.",
    notes: "Most playful. Drag-based. ~30s per round.",
    Component: StampSort,
  },
];

export default function ArcadeLab() {
  useEffect(() => {
    document.title = "Arcade Lab — Locus";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    const prev = robots.getAttribute("content");
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      if (prev) robots!.setAttribute("content", prev);
      else robots!.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">
            Arcade Lab
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Pick the new footer game. All three are fully playable.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAMES.map(({ id, name, tagline, notes, Component }) => (
            <article
              key={id}
              className="border-2 border-foreground bg-background p-5 shadow-[6px_6px_0_0_hsl(var(--accent))] flex flex-col"
            >
              <header className="mb-4">
                <h2 className="font-heading font-extrabold text-2xl leading-tight">
                  {name}
                </h2>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">
                  {tagline}
                </p>
              </header>

              <div className="flex-1 mb-4">
                <Component />
              </div>

              <footer className="border-t-2 border-foreground/10 pt-3">
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                  {notes}
                </p>
              </footer>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground">
          Reply with the name of the one you want shipped to the footer.
        </p>
      </div>
    </div>
  );
}
