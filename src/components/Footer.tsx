export default function Footer() {
  return (
    <footer className="relative pt-12 pb-10 px-4">
      {/* Gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      
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
    </footer>
  );
}
