import { useState, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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

  const inputClass = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow text-sm";

  return (
    <section id="waitlist" className="py-24 px-4">
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          Join the <span className="text-accent">Waitlist</span>
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          Be among the first to access Lex Root when we launch.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Students */}
          <form onSubmit={handleStudent} className="bg-card rounded-xl p-8 border border-border space-y-4">
            <h3 className="font-heading font-semibold text-lg mb-2">For Students</h3>
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
            <button
              type="submit"
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-opacity"
            >
              I want an internship
            </button>
          </form>

          {/* Firms */}
          <form onSubmit={handleFirm} className="bg-card rounded-xl p-8 border border-border space-y-4">
            <h3 className="font-heading font-semibold text-lg mb-2">For Firms</h3>
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
            <button
              type="submit"
              className="w-full py-3.5 rounded-lg border-2 border-accent text-accent font-heading font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              I want pre-screened interns
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}