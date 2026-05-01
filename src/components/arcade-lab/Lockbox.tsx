import { useState, useEffect } from "react";
import { Lock, Unlock, RotateCcw } from "lucide-react";

const TARGET_KEY = "locus.lockbox.demo.target";

const rollTarget = (): [number, number, number] => [
  Math.floor(Math.random() * 10),
  Math.floor(Math.random() * 10),
  Math.floor(Math.random() * 10),
];

export default function Lockbox() {
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [dials, setDials] = useState<[number, number, number]>([0, 0, 0]);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState(0);

  const reset = () => {
    const t = rollTarget();
    setTarget(t);
    sessionStorage.setItem(TARGET_KEY, JSON.stringify(t));
    setDials([0, 0, 0]);
    setTries(0);
    setSolved(false);
    setHint(0);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(TARGET_KEY);
    if (saved) {
      try {
        setTarget(JSON.parse(saved));
        return;
      } catch {
        /* fall through */
      }
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bump = (i: number, dir: 1 | -1) => {
    if (solved) return;
    setDials((d) => {
      const next = [...d] as [number, number, number];
      next[i] = (next[i] + dir + 10) % 10;
      return next;
    });
  };

  const tryUnlock = () => {
    if (solved) return;
    setTries((t) => t + 1);
    if (dials.every((v, i) => v === target[i])) {
      setSolved(true);
      setHint(3);
    } else {
      const correct = dials.reduce((acc, v, i) => acc + (v === target[i] ? 1 : 0), 0);
      setHint(correct);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {solved ? <Unlock size={18} className="text-accent" /> : <Lock size={18} />}
          <span className="font-mono text-xs text-muted-foreground">
            {solved ? "Brief unsealed" : "Crack the brief"}
          </span>
        </div>
        <button
          onClick={reset}
          className="p-1.5 border-2 border-foreground/40 hover:border-foreground transition-colors"
          aria-label="New code"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className={`flex items-stretch gap-2 mb-4 ${shake ? "animate-[lbshake_0.4s_ease]" : ""}`}>
        {dials.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col">
            <button
              onClick={() => bump(i, 1)}
              disabled={solved}
              className="border-2 border-foreground bg-background hover:bg-foreground/5 py-1 disabled:opacity-40"
              aria-label={`Increase digit ${i + 1}`}
            >
              <span className="font-mono text-xs">▲</span>
            </button>
            <div
              className={`border-x-2 border-foreground py-5 text-center font-heading font-extrabold text-4xl tabular-nums ${
                solved ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
              }`}
            >
              {v}
            </div>
            <button
              onClick={() => bump(i, -1)}
              disabled={solved}
              className="border-2 border-foreground bg-background hover:bg-foreground/5 py-1 disabled:opacity-40"
              aria-label={`Decrease digit ${i + 1}`}
            >
              <span className="font-mono text-xs">▼</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5" aria-label={`${hint} of 3 correct`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full border-2 border-foreground ${
                i < hint ? "bg-accent" : "bg-background"
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          Tries {String(tries).padStart(2, "0")}
        </span>
      </div>

      <button
        onClick={tryUnlock}
        disabled={solved}
        className="w-full border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors py-2.5 font-mono text-xs tracking-wider uppercase disabled:opacity-60 shadow-[3px_3px_0_0_hsl(var(--accent))]"
      >
        {solved ? "Sustained" : "Try unlock"}
      </button>

      <p className="mt-3 text-[11px] text-muted-foreground font-mono leading-relaxed">
        Dots show how many digits are correct — not which ones.
      </p>

      <style>{`
        @keyframes lbshake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
