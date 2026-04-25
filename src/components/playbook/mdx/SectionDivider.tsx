export function SectionDivider({ label }: { label?: string }) {
  return (
    <div
      className="my-10 flex items-center gap-3 text-muted-foreground"
      aria-hidden
    >
      <span className="font-mono text-[10px] tracking-[0.2em]">///</span>
      {label && (
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
          {label}
        </span>
      )}
      <span className="flex-1 border-t border-border/60" />
    </div>
  );
}
