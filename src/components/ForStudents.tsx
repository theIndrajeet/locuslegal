import { Send, Target, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  { icon: Send, title: "Direct Apply", desc: "Apply directly to top firms. No middleman, no referral needed." },
  { icon: Target, title: "Skill-Based Matching", desc: "Get matched with firms looking for exactly what you bring to the table." },
  { icon: ShieldCheck, title: "Guaranteed Internship", desc: "Complete your profile, prove your merit, and we guarantee you a placement." },
];

export default function ForStudents() {
  const ref = useScrollReveal();

  return (
    <section id="students" className="py-24 px-4">
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          Built for the <span className="text-accent">95%</span> that top firms ignore.
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
          You don't need an NLU tag. You need a platform that sees your work.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-xl p-8 border border-border hover:border-accent/40 transition-colors group">
              <f.icon className="text-accent mb-4" size={28} />
              <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#waitlist" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-opacity">
            Join as a Student
          </a>
        </div>
      </div>
    </section>
  );
}