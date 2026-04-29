import { Link, Outlet, useLocation } from "react-router-dom";
import { Loader2, ShieldOff } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import AdminSidebar from "./AdminSidebar";

const labels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/waitlist": "Waitlist",
  "/admin/beta": "Beta Testers",
  "/admin/vacancies": "Vacancies",
  "/admin/bar": "The Bar",
  "/admin/updates": "Updates",
  "/admin/emails": "Email Log",
};

export default function AdminLayout() {
  const isAdmin = useAdminRole();
  const { pathname } = useLocation();

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-2 border-foreground space-y-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
          <div className="flex justify-center">
            <ShieldOff className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have admin access to this console.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const crumb =
    labels[pathname] ??
    Object.entries(labels).find(([k]) => pathname.startsWith(k + "/"))?.[1] ??
    "Admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full pt-16">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b-2 border-foreground/20 bg-background/80 backdrop-blur sticky top-16 z-30 px-3">
            <SidebarTrigger />
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Admin <span className="mx-1.5 opacity-50">/</span>
              <span className="text-foreground">{crumb}</span>
            </div>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
