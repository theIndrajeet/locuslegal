export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <span className="font-heading text-xl font-bold">
            Lex<span className="text-accent">Root</span>
          </span>
          <p className="text-sm text-muted-foreground mt-1">Your merit. Your internship.</p>
        </div>
        <div className="flex gap-6 text-muted-foreground text-sm">
          <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Lex Root. All rights reserved.</p>
      </div>
    </footer>
  );
}