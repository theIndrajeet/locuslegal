import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function ReaderTOC({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
        On this page
      </p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById(item.id);
            if (el) {
              window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
            }
          }}
          className={`block text-xs leading-snug py-1 border-l-2 pl-3 transition-all ${
            activeId === item.id
              ? "border-accent text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          } ${item.level === 3 ? "pl-6" : ""}`}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
