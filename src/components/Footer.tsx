import FooterArcade from "./FooterArcade";

export default function Footer() {
  return (
    <footer className="relative">
      {/* Arcade Game */}
      <FooterArcade />

      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Branding */}
      <div className="pt-12 pb-10 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="font-heading leading-none">
              <span className="text-xl font-bold">Loc<span className="text-accent">us</span></span>
              <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase ml-1">by LexRoot</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Your merit. Your internship.</p>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Locus by LexRoot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
