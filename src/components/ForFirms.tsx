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
    <section id="firms" className="py-28 px-4 bg-muted/30">
      <div ref={ref} className="container mx-auto max-w-5xl opacity-0">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 tracking-tight">
          Stop drowning in <span className="text-accent">unscreened applications.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg">
          Great interns are everywhere — not just at NLUs. Let us bring them to you.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="relative bg-card rounded-2xl p-8 border border-border overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
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
          <a href="#waitlist" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-accent text-accent font-heading font-bold hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 transition-all duration-300">
            List Your Firm
          </a>
        </div>
      </div>
    </section>
  );
}
