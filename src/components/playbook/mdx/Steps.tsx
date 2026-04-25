import type { ReactNode } from "react";

interface Step {
  title: string;
  children: ReactNode;
}

export function Steps({ items }: { items: Step[] }) {
  return (
    <ol className="my-8 space-y-4 list-none pl-0 [counter-reset:step]">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-14 list-none [counter-increment:step]"
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-md border-2 border-accent/60 bg-accent/10 font-mono text-sm font-bold text-accent"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-1">
            <p className="font-semibold text-foreground mb-1 leading-snug">
              {item.title}
            </p>
            <div className="text-sm leading-relaxed text-foreground/85 [&>p]:mb-2 [&>p:last-child]:mb-0">
              {item.children}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
