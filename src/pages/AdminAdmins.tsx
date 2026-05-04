import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, ShieldPlus, ShieldMinus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminRow {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  is_self: boolean;
}

interface SearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  is_already_admin: boolean;
}

export default function AdminAdmins() {
  usePageMeta({
    title: "Admin Access — Locus",
    description: "Grant or revoke admin access for Locus.",
    path: "/admin/admins",
  });

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<AdminRow | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    const { data, error } = await supabase.rpc("list_admins");
    if (error) {
      toast.error("Failed to load admins", { description: error.message });
      setAdmins([]);
    } else {
      setAdmins((data ?? []) as AdminRow[]);
    }
    setLoadingAdmins(false);
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  // Debounced live search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("find_user_for_admin", {
        p_query: q,
      });
      if (error) {
        toast.error("Search failed", { description: error.message });
        setResults([]);
      } else {
        setResults((data ?? []) as SearchResult[]);
      }
      setSearching(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const handleGrant = async (user: SearchResult) => {
    setActingId(user.id);
    const { error } = await supabase.rpc("grant_admin_role", {
      p_user_id: user.id,
    });
    setActingId(null);
    if (error) {
      toast.error("Could not grant admin", { description: error.message });
      return;
    }
    toast.success(`Admin granted to ${user.username ?? user.email ?? "user"}`);
    setQuery("");
    setResults([]);
    void loadAdmins();
  };

  const handleRevoke = async (user: AdminRow) => {
    setActingId(user.id);
    const { error } = await supabase.rpc("revoke_admin_role", {
      p_user_id: user.id,
    });
    setActingId(null);
    setConfirmRevoke(null);
    if (error) {
      toast.error("Could not revoke admin", { description: error.message });
      return;
    }
    toast.success(`Admin revoked from ${user.username ?? user.email ?? "user"}`);
    void loadAdmins();
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Console / Access
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-black">
          Admin Access
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Grant or revoke admin access by username or email. New admins get the
          full dashboard immediately.
        </p>
      </header>

      {/* Search & grant */}
      <section className="mb-10">
        <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 bg-accent" /> Grant access
        </h2>
        <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, name, or email…"
              className="pl-9 border-2 border-foreground"
              autoComplete="off"
            />
          </div>

          <div className="mt-4 min-h-[3rem]">
            {query.trim().length < 2 ? (
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Type at least 2 characters to search.
              </p>
            ) : searching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <ul className="divide-y-2 divide-foreground/10 border-2 border-foreground/20">
                {results.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-accent/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-extrabold truncate flex items-center gap-2">
                        {r.display_name || r.username || "—"}
                        {r.is_already_admin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest border border-accent text-accent px-1.5 py-0.5">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.username ? `@${r.username}` : null}
                        {r.username && r.email ? " · " : null}
                        {r.email}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleGrant(r)}
                      disabled={r.is_already_admin || actingId === r.id}
                      className="border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] shrink-0"
                    >
                      {actingId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <ShieldPlus className="w-3.5 h-3.5 mr-1" />
                      )}
                      {r.is_already_admin ? "Already admin" : "Grant admin"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Current admins */}
      <section>
        <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 bg-accent" /> Current admins
          {!loadingAdmins && (
            <span className="text-xs font-mono text-muted-foreground tracking-widest">
              ({admins.length})
            </span>
          )}
        </h2>
        <div className="border-2 border-foreground bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]">
          {loadingAdmins ? (
            <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : admins.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No admins.</div>
          ) : (
            <ul className="divide-y-2 divide-foreground/10">
              {admins.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-extrabold truncate flex items-center gap-2">
                      {a.display_name || a.username || "—"}
                      {a.is_self && (
                        <span className="text-[10px] font-mono uppercase tracking-widest border border-accent text-accent px-1.5 py-0.5">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.username ? `@${a.username}` : null}
                      {a.username && a.email ? " · " : null}
                      {a.email}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={a.is_self || actingId === a.id}
                    onClick={() => setConfirmRevoke(a)}
                    className="border-2 border-foreground shrink-0"
                    title={
                      a.is_self
                        ? "You cannot revoke your own admin access"
                        : "Revoke admin"
                    }
                  >
                    <ShieldMinus className="w-3.5 h-3.5 mr-1" />
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AlertDialog
        open={!!confirmRevoke}
        onOpenChange={(open) => !open && setConfirmRevoke(null)}
      >
        <AlertDialogContent className="border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))]">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRevoke?.display_name || confirmRevoke?.username || "This user"}{" "}
              will lose access to the entire admin console immediately. This can
              be re-granted at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
