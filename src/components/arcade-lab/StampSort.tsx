import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

type Pile = "A" | "B" | "C";
type Stamp = { id: number; text: string; pile: Pile };

const ITEMS: Omit<Stamp, "id">[] = [
  { text: "Master Services Agreement, signed 12 Mar.", pile: "A" },
  { text: "Following up on our call yesterday — best, J.", pile: "B" },
  { text: "Re: standing of plaintiff under Section 9.", pile: "C" },
  { text: "NDA between Parties, effective 1 Jan 2026.", pile: "A" },
  { text: "Quick question about the deck — got 5 mins?", pile: "B" },
  { text: "Analysis of jurisdictional issues, 4 pages.", pile: "C" },
  { text: "Lease deed for premises at 12 Marine Dr.", pile: "A" },
  { text: "Hi team, sharing notes from today's sync.", pile: "B" },
  { text: "Memo on liability under Sale of Goods Act.", pile: "C" },
];

const PILES: { id: Pile; label: string }[] = [
  { id: "A", label: "Contract" },
  { id: "B", label: "Email" },
  { id: "C", label: "Memo" },
];

let nextId = 1;
const seed = (): Stamp[] =>
  [...ITEMS].sort(() => Math.random() - 0.5).map((s) => ({ ...s, id: nextId++ }));

export default function StampSort() {
  const [stack, setStack] = useState<Stamp[]>(() => seed());
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [hover, setHover] = useState<Pile | null>(null);
  const [stampedTo, setStampedTo] = useState<Pile | null>(null);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    if (stack.length === 0) setDone(true);
  }, [stack]);

  const reset = () => {
    setStack(seed());
    setScore(0);
    setWrong(0);
    setDone(false);
    setStampedTo(null);
  };

  const drop = (pile: Pile) => {
    if (stack.length === 0) return;
    const top = stack[0];
    setHover(null);
    if (top.pile === pile) {
      setStampedTo(pile);
      setScore((s) => s + 1);
      setTimeout(() => {
        setStack((q) => q.slice(1));
        setStampedTo(null);
      }, 320);
    } else {
      setWrong((w) => w + 1);
      setBad(true);
      setTimeout(() => setBad(false), 380);
    }
  };

  const top = stack[0];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground">Drag to the right pile</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            <span className="text-accent">{score}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-foreground/60">{ITEMS.length}</span>
          </span>
          <button
            onClick={reset}
            className="p-1.5 border-2 border-foreground/40 hover:border-foreground"
            aria-label="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="relative h-[140px] mb-4 border-2 border-dashed border-foreground/30 flex items-center justify-center">
        {done ? (
          <div className="text-center">
            <div className="font-heading font-extrabold text-xl mb-1">Filed.</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {score} correct · {wrong} misfiled
            </div>
          </div>
        ) : top ? (
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(top.id));
            }}
            className={`select-none cursor-grab active:cursor-grabbing bg-background border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--accent))] px-4 py-3 max-w-[80%] ${
              bad ? "animate-[ssshake_0.38s_ease]" : ""
            } ${stampedTo ? "opacity-30" : ""}`}
          >
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase mb-1">
              Exhibit
            </div>
            <div className="font-body text-sm leading-snug">{top.text}</div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PILES.map((p) => (
          <button
            key={p.id}
            onDragOver={(e) => {
              e.preventDefault();
              setHover(p.id);
            }}
            onDragLeave={() => setHover((h) => (h === p.id ? null : h))}
            onDrop={(e) => {
              e.preventDefault();
              drop(p.id);
            }}
            onClick={() => drop(p.id)}
            disabled={done}
            className={`flex flex-col items-center justify-center py-4 border-2 border-foreground transition-all ${
              hover === p.id
                ? "bg-accent text-accent-foreground -translate-y-0.5 shadow-[3px_5px_0_0_hsl(var(--foreground))]"
                : "bg-background text-foreground hover:bg-foreground/5"
            } ${stampedTo === p.id ? "bg-accent text-accent-foreground" : ""} disabled:opacity-50`}
          >
            <span className="font-heading font-extrabold text-2xl leading-none">{p.id}</span>
            <span className="font-mono text-[10px] tracking-wider uppercase mt-1">{p.label}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground font-mono leading-relaxed">
        Drag the stamp — or tap a pile if you're on mobile.
      </p>

      <style>{`
        @keyframes ssshake {
          0%,100% { transform: translateX(0) rotate(0); }
          25% { transform: translateX(-6px) rotate(-1deg); }
          75% { transform: translateX(6px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
