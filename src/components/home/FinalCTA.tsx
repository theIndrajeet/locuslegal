import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 bg-card/40 border-t-2 border-border">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
          Get in early. <span className="text-accent">Get in front.</span>
        </h2>
        <p className="text-lg text-foreground/70 mb-10 max-w-xl mx-auto">
          Locus is rolling out in waves. Join the waitlist now to lock your spot — students, firms, and institutions all welcome.
        </p>
        <Link to="/waitlist">
          <Button size="lg" className="font-heading text-base px-10 py-4">
            Join the Waitlist <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
