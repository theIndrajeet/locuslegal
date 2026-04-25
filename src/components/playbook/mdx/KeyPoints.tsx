import type { ReactNode } from "react";

export function KeyPoints({ title = "Remember this", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-accent bg-accent/5 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
        {title}
      </p>
      <div className="text-sm leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
