import { Link } from "react-router-dom";
import { ExternalLink, User, Pencil } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  openToOpportunities: boolean;
  bio?: string;
}

export default function IdentityRow({
  userId,
  username,
  displayName,
  avatarUrl,
  openToOpportunities: initialOTO,
  bio = "",
}: Props) {
  const [oto, setOto] = useState(initialOTO);
  const [saving, setSaving] = useState(false);

  const toggleOTO = async () => {
    const next = !oto;
    setOto(next);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ open_to_opportunities: next })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setOto(!next);
      toast.error("Could not update status");
    } else {
      toast.success(next ? "Marked as open to opportunities" : "Status set to private");
    }
  };

  const initials = (displayName || username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="border-2 border-border bg-card px-4 py-3 shadow-[3px_3px_0_0_hsl(var(--border))]">
      <div className="flex items-center gap-3 flex-wrap">
        <Avatar className="h-10 w-10 border-2 border-border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || username} /> : null}
          <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
            {initials || <User size={14} />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-heading text-base font-extrabold text-foreground truncate">
              {displayName || username}
            </span>
            <span className="font-mono text-xs text-muted-foreground">@{username}</span>
          </div>
          {bio.trim().length < 40 && (
            <Link
              to="/profile/edit"
              className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
            >
              <Pencil size={10} />
              {bio.trim().length === 0 ? "Add a bio" : "Flesh out your bio"}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={toggleOTO}
          disabled={saving}
          className={`inline-flex items-center gap-2 border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
            oto
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={oto}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${oto ? "bg-accent" : "bg-muted-foreground"}`}
          />
          {oto ? "Open to opportunities" : "Not seeking"}
        </button>

        <Link
          to={`/u/${username}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
        >
          View public profile
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}
