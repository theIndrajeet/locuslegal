import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import ForStudents from "@/components/ForStudents";
import ForFirms from "@/components/ForFirms";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <StatsBar />
    <ForStudents />
    <ForFirms />
    <WaitlistSection />
    <Footer />
  </div>
);

export default Index;