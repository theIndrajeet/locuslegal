import { useState } from "react";
import { Copy, Check, Mail } from "lucide-react";

export function EmailBlock({
  subject,
  body,
  to,
}: {
  subject: string;
  body: string;
  to?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const full = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="my-6 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email Template
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="px-4 py-3 space-y-2 text-sm">
        {to && (
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">To:</span>
            <span className="text-foreground">{to}</span>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Subject:</span>
          <span className="text-foreground font-medium">{subject}</span>
        </div>
        <div className="pt-3 border-t border-border/50 whitespace-pre-wrap text-foreground leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}
