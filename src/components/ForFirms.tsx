import { UserCheck, BadgeCheck, Award } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  { icon: UserCheck, title: "Pre-Screened Candidates", desc: "Every applicant is vetted for skills, not just pedigree. Save hours on filtering." },
  { icon: BadgeCheck, title: "Free Listing", desc: "Post your internship openings at zero cost. We want great matches, not your money." },
  { icon: Award, title: "Quality Interns", desc: "Access a talent pool that most firms never see — driven, skilled, and hungry." },
];

export default function ForFirms() {
  const ref = useScrollReveal();

  return (
    <section id="firms" className="py-24 px-4 bg-muted/40">
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          Stop drowning in <span className="text-accent">unscreened applications.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
          Great interns are everywhere — not just at NLUs. Let us bring them to you.
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
          <a href="#waitlist" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border-2 border-accent text-accent font-heading font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
            List Your Firm
          </a>
        </div>
      </div>
    </section>
  );
}