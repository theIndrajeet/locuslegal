import { useState, useMemo } from "react";
import { Search, Building2, MapPin, Star, Phone, Mail } from "lucide-react";
import firms from "@/data/firms.json";

const allCities = [...new Set(firms.map((f) => f.city).filter(Boolean))].sort();
const allAreas = [...new Set(firms.map((f) => f.area).filter(Boolean))].sort();
const allTiers = [...new Set(firms.map((f) => f.tier).filter(Boolean))].sort();

const PAGE_SIZE = 30;

type FirmType = "Law Firm" | "Chamber" | "Individual Advocate";

const typeFilters: { label: string; value: FirmType | "" }[] = [
  { label: "All", value: "" },
  { label: "Law Firms", value: "Law Firm" },
  { label: "Chambers", value: "Chamber" },
  { label: "Individual Advocates", value: "Individual Advocate" },
];

function getType(firm: (typeof firms)[0]): FirmType {
  const name = firm.name.toLowerCase();
  const tierLower = (firm.tier || "").toLowerCase();
  if (name.includes("chamber") || tierLower.includes("individual chamber")) return "Chamber";
  if (name.includes("advocate") || name.includes("adv.") || name.includes("adv ")) return "Individual Advocate";
  return "Law Firm";
}

export default function Directory() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [tier, setTier] = useState("");
  const [type, setType] = useState<FirmType | "">("");
  const [page, setPage] = useState(1);

  // Filter areas based on selected city
  const filteredAreas = useMemo(() => {
    if (!city) return allAreas;
    return [...new Set(firms.filter((f) => f.city === city).map((f) => f.area).filter(Boolean))].sort();
  }, [city]);

  const filtered = useMemo(() => {
    setPage(1);
    return firms.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (city && f.city !== city) return false;
      if (area && f.area !== area) return false;
      if (tier && f.tier !== tier) return false;
      return true;
    });
  }, [search, city, area, tier]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectClass =
    "bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors";

  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 md:px-8 mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Find Firms, Chambers{" "}
          <span className="text-accent">&amp; Companies</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore {firms.length.toLocaleString()} law firms, chambers, and legal practices across India.
        </p>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 md:px-8 mb-10">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search by firm name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              />
            </div>
            <select value={city} onChange={(e) => { setCity(e.target.value); setArea(""); }} className={selectClass}>
              <option value="">All Cities</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
              <option value="">All Areas</option>
              {filteredAreas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectClass}>
              <option value="">All Tiers</option>
              {allTiers.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 md:px-8">
        <p className="text-sm text-muted-foreground mb-6">
          Showing {paginated.length} of {filtered.length} results
        </p>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="mx-auto mb-4 opacity-40" size={48} />
            <p className="text-lg">No firms match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-heading text-base font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">
                      {f.name}
                    </h3>
                    {f.rating && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-accent/10 text-accent px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                        <Star size={11} /> {f.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[11px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {f.tier}
                    </span>
                  </div>

                  {f.address && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                      {f.address}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={12} className="shrink-0" />
                      <span>{f.area}{f.area && f.city ? ", " : ""}{f.city}</span>
                    </div>
                    {f.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone size={12} className="shrink-0" />
                        <span>{f.phone}</span>
                      </div>
                    )}
                    {f.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail size={12} className="shrink-0" />
                        <a href={`mailto:${f.email}`} className="hover:text-accent transition-colors truncate">
                          {f.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
