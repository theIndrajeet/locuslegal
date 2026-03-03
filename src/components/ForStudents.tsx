import { Send, Target, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Send, title: "Direct Apply", desc: "Apply directly to top firms. No middleman, no referral needed." },
  { icon: Target, title: "Skill-Based Matching", desc: "Get matched with firms looking for exactly what you bring to the table." },
  { icon: ShieldCheck, title: "Guaranteed Internship", desc: "Complete your profile, prove your merit, and we guarantee you a placement." },
];

export default function ForStudents() {
  const ref = useScrollReveal();

  return (
    <section id="students" className="py-28 px-4">
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 tracking-tight">
          Built for the <span className="text-accent">95%</span> that top firms ignore.
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg">
          You don't need an NLU tag. You need a platform that sees your work.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="relative bg-card rounded-2xl p-8 border border-border overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Top accent gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/80 via-accent to-accent/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <f.icon className="text-accent" size={24} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <a href="#waitlist">
            <Button size="lg" className="font-heading font-bold px-8 py-4">Join as a Student</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
