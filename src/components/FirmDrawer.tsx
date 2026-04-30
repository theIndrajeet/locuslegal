import { useState } from "react";
import { Star, MapPin, Phone, Mail, ExternalLink, Sparkles, ShieldCheck, Eye, MessageSquarePlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DraftEmailDialog, { type DraftEmailTarget } from "@/components/apply/DraftEmailDialog";
import SuggestFixDialog from "@/components/directory/SuggestFixDialog";

type FirmType = "Law Firm" | "Chamber" | "Individual Advocate";

interface Firm {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  area?: string;
  tier?: string;
  rating?: number | string;
  phone?: string;
  email?: string;
  verified?: string;
  verificationNote?: string;
  channel?: string;
}

interface FirmDrawerProps {
  firm: Firm | null;
  type: FirmType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FirmDrawer({ firm, type, open, onOpenChange }: FirmDrawerProps) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  if (!firm) return null;

  const mapsUrl = firm.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firm.address)}`
    : null;

  const draftTarget: DraftEmailTarget | null = firm.email
    ? {
        id: `firm:${firm.name}:${firm.email}`,
        name: firm.name,
        email: firm.email,
        kind: "firm",
        type,
        city: firm.city ?? null,
        practice_areas: type,
      }
    : null;

  const isVerified = firm.verified === "verified";
  const isLikely = firm.verified === "likely";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-xl leading-tight">{firm.name}</SheetTitle>
          <SheetDescription className="sr-only">Details for {firm.name}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {firm.tier && (
              <span className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                {firm.tier}
              </span>
            )}
            <span className="text-xs font-medium bg-accent/10 text-accent px-3 py-1 rounded-full">
              {type}
            </span>
            {firm.rating && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full">
                <Star size={12} /> {firm.rating}
              </span>
            )}
          </div>

          {/* Verification */}
          {(isVerified || isLikely) && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-help ${
                      isVerified
                        ? "border-foreground bg-accent text-accent-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
                        : "border-border bg-muted/40 text-foreground"
                    }`}
                  >
                    {isVerified ? <ShieldCheck size={16} /> : <Eye size={16} className="text-muted-foreground" />}
                    <span className="text-xs font-bold">
                      {isVerified ? "Independently verified" : "Listed source"}
                    </span>
                  </div>
                </TooltipTrigger>
                {firm.verificationNote && (
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{firm.verificationNote}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Address */}
          {firm.address && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-foreground">
                <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />
                <span>{firm.address}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-6">
                {firm.area}{firm.area && firm.city ? ", " : ""}{firm.city}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
            {firm.phone && (
              <a
                href={`tel:${firm.phone}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Phone size={14} className="text-accent" />
                </div>
                {firm.phone}
              </a>
            )}
            {firm.email ? (
              <a
                href={`mailto:${firm.email}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Mail size={14} className="text-accent" />
                </div>
                <span className="truncate">{firm.email}</span>
              </a>
            ) : firm.phone ? (
              <p className="text-xs text-muted-foreground italic pl-1">No public email — best reached by phone.</p>
            ) : null}
            {!firm.phone && !firm.email && (
              <p className="text-sm text-muted-foreground">No contact information available.</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {draftTarget && (
              <button
                type="button"
                onClick={() => setDraftOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Sparkles size={14} />
                Draft Application Email
              </button>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${
                  draftTarget
                    ? "bg-card border border-border text-foreground hover:border-accent/40"
                    : "bg-accent text-accent-foreground hover:opacity-90"
                }`}
              >
                <ExternalLink size={14} />
                Open in Google Maps
              </a>
            )}
          </div>

          {/* Suggest a fix */}
          <div className="pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors mx-auto"
            >
              <MessageSquarePlus size={12} />
              Something wrong? Suggest a fix
            </button>
          </div>
        </div>
      </SheetContent>

      <DraftEmailDialog open={draftOpen} onOpenChange={setDraftOpen} target={draftTarget} />
      <SuggestFixDialog firm={firm} open={suggestOpen} onOpenChange={setSuggestOpen} />
    </Sheet>
  );
}
