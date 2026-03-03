import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 500000, suffix: "+", label: "Law students in India" },
  { value: 600, prefix: "~", label: "Top-firm internship spots" },
  { value: 1800, label: "Colleges with no placement cell" },
  { value: 26, label: "NLUs that hoard access" },
];

function AnimatedCounter({ target, prefix = "", suffix = "", started }: { target: number; prefix?: string; suffix?: string; started: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, target]);

  const formatted = count >= 1000 ? count.toLocaleString("en-IN") : count.toString();
  return <span>{prefix}{formatted}{suffix}</span>;
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-stats text-stats-foreground py-14 px-4">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-heading text-3xl md:text-4xl font-extrabold mb-1">
              <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} started={started} />
            </div>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}