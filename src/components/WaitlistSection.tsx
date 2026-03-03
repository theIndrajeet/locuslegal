import { useState, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export default function WaitlistSection() {
  const { toast } = useToast();
  const ref = useScrollReveal();

  const [studentForm, setStudentForm] = useState({ email: "", year: "", city: "" });
  const [firmForm, setFirmForm] = useState({ email: "", firmName: "", city: "" });

  const handleStudent = (e: FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("lexroot_students") || "[]");
    existing.push({ ...studentForm, submittedAt: new Date().toISOString() });
    localStorage.setItem("lexroot_students", JSON.stringify(existing));
    setStudentForm({ email: "", year: "", city: "" });
    toast({ title: "You're on the list! 🎉", description: "We'll reach out when we launch." });
  };

  const handleFirm = (e: FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("lexroot_firms") || "[]");
    existing.push({ ...firmForm, submittedAt: new Date().toISOString() });
    localStorage.setItem("lexroot_firms", JSON.stringify(existing));
    setFirmForm({ email: "", firmName: "", city: "" });
    toast({ title: "You're on the list! 🎉", description: "We'll connect you with top candidates soon." });
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all text-sm";

  return (
    <section id="waitlist" className="relative py-28 px-4 overflow-hidden">
      {/* Subtle radial gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none" />
      
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0 relative z-10">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 tracking-tight">
          Join the <span className="text-accent">Waitlist</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
          Be among the first to access Lex Root when we launch.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Students */}
          <form onSubmit={handleStudent} className="bg-card rounded-2xl p-8 border border-border space-y-5 hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300">
            <h3 className="font-heading font-bold text-xl mb-1">For Students</h3>
            <input
              required type="email" placeholder="Email address"
              className={inputClass}
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
            />
            <select
              required className={inputClass}
              value={studentForm.year}
              onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
            >
              <option value="" disabled>Year of study</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
              <option>5th Year</option>
              <option>LLM</option>
            </select>
            <input
              required type="text" placeholder="City"
              className={inputClass}
              value={studentForm.city}
              onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
            />
            <InteractiveHoverButton type="submit" text="I want an internship" className="w-full py-4 border-primary bg-primary text-primary-foreground font-heading font-bold" />
          </form>

          {/* Firms */}
          <form onSubmit={handleFirm} className="bg-card rounded-2xl p-8 border border-border space-y-5 hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300">
            <h3 className="font-heading font-bold text-xl mb-1">For Firms</h3>
            <input
              required type="email" placeholder="Email address"
              className={inputClass}
              value={firmForm.email}
              onChange={(e) => setFirmForm({ ...firmForm, email: e.target.value })}
            />
            <input
              required type="text" placeholder="Firm name"
              className={inputClass}
              value={firmForm.firmName}
              onChange={(e) => setFirmForm({ ...firmForm, firmName: e.target.value })}
            />
            <input
              required type="text" placeholder="City"
              className={inputClass}
              value={firmForm.city}
              onChange={(e) => setFirmForm({ ...firmForm, city: e.target.value })}
            />
            <InteractiveHoverButton type="submit" text="I want pre-screened interns" className="w-full py-4 border-accent bg-transparent text-accent font-heading font-bold" />
          </form>
        </div>
      </div>
    </section>
  );
}
