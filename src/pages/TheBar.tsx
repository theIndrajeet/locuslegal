import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TheBar() {
  usePageMeta({ title: "The Bar — Community Q&A", description: "Ask questions, share insights, and connect with India's legal community on The Bar.", path: "/the-bar" });
  return (
    <section className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
            <MessageSquare size={36} className="text-accent" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <span className="text-[10px] font-bold text-accent-foreground">!</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground mb-3">
          The Bar
        </h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-md">
          A community Q&A forum for law students, firms & institutions.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-sm font-semibold text-accent">Coming Soon</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">
          We're building something special. The Bar will be your go-to place to ask questions, share insights, and connect with the legal community.
        </p>

        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </Link>
      </div>
    </section>
  );
}
