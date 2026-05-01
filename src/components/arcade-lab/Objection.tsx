import { useState, useEffect, useCallback } from "react";
import { Delete, CornerDownLeft, RotateCcw } from "lucide-react";

const ANSWERS = [
  "WRITS", "TORTS", "BENCH", "GAVEL", "JUDGE", "PLEAD", "VENUE", "BRIEF",
  "GUILT", "LIBEL", "PROBE", "ENACT", "PROXY", "OATHS", "PROOF", "CLAIM",
  "MERIT", "FRAUD", "FORUM", "ARSON", "SUITS", "GRAND", "LEASE", "TITLE",
  "DEEDS", "BONDS", "SERVE", "ORDER", "QUASH", "STARE", "COURT", "CANON",
  "DICTA", "FELON", "HEIRS", "LIENS", "PARTY", "POWER", "REPLY", "RIGHT",
  "STATE", "TRIAL", "VOTER", "VOIDS",
];

const ACCEPT = new Set([
  ...ANSWERS,
  "AUDIO", "RAISE", "CRANE", "SLATE", "CRATE", "ADIEU", "ABOUT", "OTHER",
  "WHICH", "THEIR", "THERE", "WOULD", "COULD", "HOUSE", "MIGHT", "THINK",
  "WHILE", "STORY", "CHILD", "MONEY", "WATER", "PLACE", "WRITE", "FIRST",
  "AFTER", "GREAT", "EVERY", "STILL", "HEART", "EARTH", "LIGHT", "POINT",
  "WORLD", "HELLO", "TODAY", "PIANO", "ROBOT", "PLANT", "OCEAN", "MOUSE",
]);

type State = "playing" | "won" | "lost";

export default function Objection() {
  const [target, setTarget] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [state, setState] = useState<State>("playing");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState("");

  const reset = useCallback(() => {
    setTarget(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
    setGuesses([]);
    setCurrent("");
    setState("playing");
    setToast("");
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const submit = useCallback(() => {
    if (state !== "playing") return;
    if (current.length !== 5) {
      setShake(true);
      setTimeout(() => setShake(false), 380);
      return;
    }
    const guess = current.toUpperCase();
    if (!ACCEPT.has(guess)) {
      flashToast("Not in word list");
      setShake(true);
      setTimeout(() => setShake(false), 380);
      return;
    }
    const next = [...guesses, guess];
    setGuesses(next);
    setCurrent("");
    if (guess === target) {
      setState("won");
      flashToast("Sustained.");
    } else if (next.length >= 6) {
      setState("lost");
      flashToast(`Overruled — ${target}`);
    }
  }, [current, guesses, state, target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state !== "playing") return;
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Backspace") {
        setCurrent((c) => c.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrent((c) => (c.length < 5 ? c + e.key.toUpperCase() : c));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, state]);

  const tap = (k: string) => {
    if (state !== "playing") return;
    if (k === "ENT") submit();
    else if (k === "DEL") setCurrent((c) => c.slice(0, -1));
    else if (current.length < 5) setCurrent((c) => c + k);
  };

  const score = (guess: string, i: number): "hit" | "near" | "miss" => {
    const g = guess[i];
    const t = target[i];
    if (g === t) return "hit";
    if (target.includes(g)) return "near";
    return "miss";
  };

  const keyStatus = (k: string): "hit" | "near" | "miss" | "" => {
    let s: "hit" | "near" | "miss" | "" = "";
    for (const g of guesses) {
      for (let i = 0; i < 5; i++) {
        if (g[i] !== k) continue;
        const v = score(g, i);
        if (v === "hit") return "hit";
        if (v === "near") s = s === "hit" ? s : "near";
        else if (s === "") s = "miss";
      }
    }
    return s;
  };

  const tileClass = (s: "hit" | "near" | "miss" | "empty") => {
    if (s === "hit") return "bg-accent text-accent-foreground border-accent";
    if (s === "near") return "bg-background text-foreground border-foreground";
    if (s === "miss") return "bg-foreground/15 text-foreground/60 border-foreground/20";
    return "bg-background text-foreground border-foreground/30";
  };

  const keyClass = (k: string) => {
    const s = keyStatus(k);
    if (s === "hit") return "bg-accent text-accent-foreground border-accent";
    if (s === "near") return "bg-foreground text-background border-foreground";
    if (s === "miss") return "bg-foreground/10 text-foreground/40 border-foreground/20";
    return "bg-background text-foreground border-foreground hover:bg-foreground/5";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground">5-letter legal term</span>
        <button
          onClick={reset}
          className="p-1.5 border-2 border-foreground/40 hover:border-foreground"
          aria-label="New word"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className={`grid grid-rows-6 gap-1.5 mb-3 ${shake ? "animate-[obshake_0.38s_ease]" : ""}`}>
        {Array.from({ length: 6 }).map((_, row) => {
          const guess = guesses[row];
          const isCurrent = !guess && row === guesses.length;
          return (
            <div key={row} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((__, col) => {
                let ch = "";
                let s: "hit" | "near" | "miss" | "empty" = "empty";
                if (guess) {
                  ch = guess[col];
                  s = score(guess, col);
                } else if (isCurrent) {
                  ch = current[col] ?? "";
                }
                return (
                  <div
                    key={col}
                    className={`aspect-square flex items-center justify-center font-heading font-extrabold text-xl border-2 ${tileClass(s)}`}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="space-y-1">
        {["QWERTYUIOP", "ASDFGHJKL", "_ZXCVBNM*"].map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {row.split("").map((k, i) => {
              if (k === "_")
                return (
                  <button
                    key={i}
                    onClick={() => tap("ENT")}
                    className={`px-2.5 py-2 border-2 ${keyClass("ENT")}`}
                    aria-label="Enter"
                  >
                    <CornerDownLeft size={12} />
                  </button>
                );
              if (k === "*")
                return (
                  <button
                    key={i}
                    onClick={() => tap("DEL")}
                    className={`px-2.5 py-2 border-2 ${keyClass("DEL")}`}
                    aria-label="Delete"
                  >
                    <Delete size={12} />
                  </button>
                );
              return (
                <button
                  key={i}
                  onClick={() => tap(k)}
                  className={`flex-1 max-w-[28px] py-2 border-2 font-heading font-bold text-xs ${keyClass(k)}`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 h-5 text-center" aria-live="polite">
        {toast && (
          <span className="inline-block px-3 py-0.5 bg-foreground text-background font-mono text-[11px] tracking-wider">
            {toast}
          </span>
        )}
      </div>

      <style>{`
        @keyframes obshake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
