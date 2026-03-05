import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function WaitlistSection() {
  const { toast } = useToast();
  const ref = useScrollReveal();

  const [studentForm, setStudentForm] = useState({ email: "", year: "", city: "", school: "" });
  const [firmForm, setFirmForm] = useState({ email: "", firmName: "", city: "" });
  const [uniForm, setUniForm] = useState({ email: "", institutionName: "", city: "", type: "" });

  const handleStudent = (e: FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("lexroot_students") || "[]");
    existing.push({ ...studentForm, submittedAt: new Date().toISOString() });
    localStorage.setItem("lexroot_students", JSON.stringify(existing));
    setStudentForm({ email: "", year: "", city: "", school: "" });
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

  const handleUni = (e: FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("lexroot_universities") || "[]");
    existing.push({ ...uniForm, submittedAt: new Date().toISOString() });
    localStorage.setItem("lexroot_universities", JSON.stringify(existing));
    setUniForm({ email: "", institutionName: "", city: "", type: "" });
    toast({ title: "You're on the list! 🎉", description: "We'll reach out about partnership options." });
  };

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 hover:border-foreground/20 transition-all text-sm";

  const selectClass =
    "w-full h-12 px-4 rounded-xl bg-background border-2 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 hover:border-foreground/20 transition-all text-sm appearance-none cursor-pointer";

  return (
    <section id="waitlist" className="relative py-28 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none" />

      <div ref={ref} className="container mx-auto max-w-5xl opacity-0 relative z-10">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 tracking-tight">
          Join the <span className="text-accent">Waitlist</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
          Be among the first to access Lex Root when we launch.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Students */}
          <motion.form
            onSubmit={handleStudent}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-card rounded-2xl p-8 border-2 border-border space-y-5 shadow-shadow hover:shadow-lg transition-shadow duration-300"
          >
            <motion.h3 variants={itemVariants} className="font-heading font-bold text-xl mb-1">For Students</motion.h3>
            <motion.div variants={itemVariants}>
              <input
                required type="email" placeholder="Email address"
                className={inputClass}
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <select
                required className={selectClass}
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
                required type="text" placeholder="School / University"
                className={inputClass}
                value={studentForm.school}
                onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                required type="text" placeholder="City"
                className={inputClass}
                value={studentForm.city}
                onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button type="submit" size="lg" className="w-full py-4 font-heading font-bold">I want an internship</Button>
            </motion.div>
          </motion.form>

          {/* Firms */}
          <motion.form
            onSubmit={handleFirm}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-card rounded-2xl p-8 border-2 border-border space-y-5 shadow-shadow hover:shadow-lg transition-shadow duration-300"
          >
            <motion.h3 variants={itemVariants} className="font-heading font-bold text-xl mb-1">For Firms</motion.h3>
            <motion.div variants={itemVariants}>
              <input
                required type="email" placeholder="Email address"
                className={inputClass}
                value={firmForm.email}
                onChange={(e) => setFirmForm({ ...firmForm, email: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                required type="text" placeholder="Firm name"
                className={inputClass}
                value={firmForm.firmName}
                onChange={(e) => setFirmForm({ ...firmForm, firmName: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                required type="text" placeholder="City"
                className={inputClass}
                value={firmForm.city}
                onChange={(e) => setFirmForm({ ...firmForm, city: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button type="submit" variant="reverse" size="lg" className="w-full py-4 font-heading font-bold">I want pre-screened interns</Button>
            </motion.div>
          </motion.form>

          {/* Universities */}
          <motion.form
            onSubmit={handleUni}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-card rounded-2xl p-8 border-2 border-border space-y-5 shadow-shadow hover:shadow-lg transition-shadow duration-300"
          >
            <motion.h3 variants={itemVariants} className="font-heading font-bold text-xl mb-1">For Universities</motion.h3>
            <motion.div variants={itemVariants}>
              <input
                required type="email" placeholder="Email address"
                className={inputClass}
                value={uniForm.email}
                onChange={(e) => setUniForm({ ...uniForm, email: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                required type="text" placeholder="Institution name"
                className={inputClass}
                value={uniForm.institutionName}
                onChange={(e) => setUniForm({ ...uniForm, institutionName: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                required type="text" placeholder="City"
                className={inputClass}
                value={uniForm.city}
                onChange={(e) => setUniForm({ ...uniForm, city: e.target.value })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <select
                required className={selectClass}
                value={uniForm.type}
                onChange={(e) => setUniForm({ ...uniForm, type: e.target.value })}
              >
                <option value="" disabled>Institution type</option>
                <option>Law College</option>
                <option>University</option>
                <option>Deemed University</option>
              </select>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button type="submit" variant="reverse" size="lg" className="w-full py-4 font-heading font-bold">Register My Institution</Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
