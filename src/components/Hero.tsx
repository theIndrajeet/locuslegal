import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Hero() {
  const ref = useScrollReveal();

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div ref={ref} className="container mx-auto text-center max-w-4xl opacity-0">
        <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-accent/15 text-accent font-heading text-sm font-semibold tracking-wide">
          Your merit. Your internship.
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-[3.75rem] lg:text-[4rem] font-extrabold leading-[1.1] tracking-tight mb-6">
          Get the internship you deserve —{" "}
          <span className="text-accent">not the one your college got you.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Lex Root is India's first merit-based legal internship platform. We connect ambitious law students with top firms — no matter which college they come from.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-base hover:opacity-90 transition-opacity"
          >
            I'm a Student
          </a>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border-2 border-accent text-accent font-heading font-semibold text-base hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            I'm a Firm
          </a>
        </div>
      </div>
    </section>
  );
}