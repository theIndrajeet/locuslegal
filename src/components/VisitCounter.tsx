import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.rpc("increment_visit_count").then(({ data }) => {
      if (typeof data === "number") setCount(data);
    });
  }, []);

  const digits = String(count ?? 0).padStart(6, "0");

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className="flex gap-[2px] rounded-md border border-accent/20 bg-black/60 px-2 py-1 backdrop-blur-sm"
        style={{
          textShadow: "0 0 6px hsl(var(--accent) / .55), 0 0 20px hsl(var(--accent) / .25)",
        }}
      >
        {digits.split("").map((d, i) => (
          <span
            key={i}
            className="inline-block w-[1.1ch] text-center font-mono text-sm tracking-widest text-accent"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {d}
          </span>
        ))}
      </div>
      <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">
        visitors
      </span>
    </div>
  );
}
