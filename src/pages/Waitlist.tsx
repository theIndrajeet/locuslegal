import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import ForStudents from "@/components/ForStudents";
import ForFirms from "@/components/ForFirms";
import ForUniversities from "@/components/ForUniversities";
import WaitlistSection from "@/components/WaitlistSection";
import { usePageMeta } from "@/hooks/usePageMeta";

const Waitlist = () => {
  usePageMeta({
    title: "Join the Locus Waitlist — Merit-Based Legal Internships",
    description: "Be first in line. Locus connects law students, firms, and institutions on merit — not college name. Join the waitlist for students, firms, or schools.",
    path: "/waitlist",
  });

  return (
    <>
      <Hero />
      <StatsBar />
      <ForStudents />
      <ForFirms />
      <ForUniversities />
      <WaitlistSection />
    </>
  );
};

export default Waitlist;
