import { Star, MapPin, Phone, Mail, ExternalLink, Building2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type FirmType = "Law Firm" | "Chamber" | "Individual Advocate";

interface Firm {
  name: string;
  address?: string;
  city?: string;
  area?: string;
  tier?: string;
  rating?: number | string;
  phone?: string;
  email?: string;
}

interface FirmDrawerProps {
  firm: Firm | null;
  type: FirmType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FirmDrawer({ firm, type, open, onOpenChange }: FirmDrawerProps) {
  if (!firm) return null;

  const mapsUrl = firm.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firm.address)}`
    : null;

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
            {firm.email && (
              <a
                href={`mailto:${firm.email}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Mail size={14} className="text-accent" />
                </div>
                <span className="truncate">{firm.email}</span>
              </a>
            )}
            {!firm.phone && !firm.email && (
              <p className="text-sm text-muted-foreground">No contact information available.</p>
            )}
          </div>

          {/* Actions */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={14} />
              Open in Google Maps
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
