import { AlertTriangle, Info, Lightbulb, Scale } from "lucide-react";
import type { ReactNode } from "react";

type CalloutType = "rule" | "warning" | "tip" | "info";

const styles: Record<CalloutType, { icon: typeof Info; cls: string; label: string }> = {
  rule: { icon: Scale, cls: "border-accent/60 bg-accent/5 text-foreground", label: "Rule" },
  warning: { icon: AlertTriangle, cls: "border-destructive/50 bg-destructive/5 text-foreground", label: "Watch out" },
  tip: { icon: Lightbulb, cls: "border-emerald-500/40 bg-emerald-500/5 text-foreground", label: "Tip" },
  info: { icon: Info, cls: "border-border bg-muted/30 text-foreground", label: "Note" },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const s = styles[type];
  const Icon = s.icon;
  return (
    <div className={`my-6 rounded-lg border-2 p-5 ${s.cls}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {title || s.label}
        </span>
      </div>
      <div className="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
