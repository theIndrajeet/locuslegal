import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import ForStudents from "@/components/ForStudents";
import ForFirms from "@/components/ForFirms";
import ForUniversities from "@/components/ForUniversities";
import WaitlistSection from "@/components/WaitlistSection";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  usePageMeta({
    title: "Locus — Merit-Based Legal Internships in India",
    description: "India's legal internship platform that connects law students with firms based on merit, not college name. Your merit. Your internship.",
    path: "/",
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

export default Index;
