import type { ReactNode } from "react";

export function Highlight({ children }: { children: ReactNode }) {
  return (
    <p className="my-8 border-l-4 border-accent pl-5 py-1 text-lg font-semibold leading-snug text-foreground">
      {children}
    </p>
  );
}
