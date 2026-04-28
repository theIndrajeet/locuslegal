import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Search, Building2, MapPin, Star, Phone, Mail, X, ArrowUpDown, LayoutGrid, Map as MapIcon, GitCompareArrows, Trophy, ArrowRight, Rocket, Globe, Users, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import firms from "@/data/firms.json";
import startupsData from "@/data/startups.json";
import FirmDrawer from "@/components/FirmDrawer";
import CompareBar from "@/components/CompareBar";
import DirectoryMap from "@/components/DirectoryMap";
import StartupDrawer, { type Startup } from "@/components/StartupDrawer";

const startups = startupsData as Startup[];

const allCities = [...new Set(firms.map((f) => f.city).filter(Boolean))].sort();
const allAreas = [...new Set(firms.map((f) => f.area).filter(Boolean))].sort();
const allTiers = [...new Set(firms.map((f) => f.tier).filter(Boolean))].sort();

// Startup filter facets (precomputed once at module load for snappy filtering)
const startupCities = [...new Set(startups.map((s) => s.city).filter(Boolean) as string[])].sort();
const startupSectors = [...new Set(startups.map((s) => s.sector).filter(Boolean) as string[])].sort();
const startupStages = [...new Set(startups.map((s) => s.stage).filter(Boolean) as string[])].sort();
const startupSizes = [
  "11-50", "51-100", "101-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+",
].filter((sz) => startups.some((s) => s.employees === sz));

const PAGE_SIZE = 30;

type FirmType = "Law Firm" | "Chamber" | "Individual Advocate";
type SortOption = "relevance" | "rating-desc" | "name-asc" | "name-desc" | "tier";
type Mode = "firms" | "startups";

const typeFilters: { label: string; value: FirmType | "" }[] = [
  { label: "All", value: "" },
  { label: "Law Firms", value: "Law Firm" },
  { label: "Chambers", value: "Chamber" },
  { label: "Individual Advocates", value: "Individual Advocate" },
];

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Rating (High → Low)", value: "rating-desc" },
  { label: "Name (A → Z)", value: "name-asc" },
  { label: "Name (Z → A)", value: "name-desc" },
  { label: "Tier", value: "tier" },
];

function getType(firm: (typeof firms)[0]): FirmType {
  const name = firm.name.toLowerCase();
  const tierLower = (firm.tier || "").toLowerCase();
  if (name.includes("chamber") || tierLower.includes("individual chamber")) return "Chamber";
  if (name.includes("advocate") || name.includes("adv.") || name.includes("adv ")) return "Individual Advocate";
  return "Law Firm";
}

export default function Directory() {
  usePageMeta({ title: "Firm Directory", description: "Browse 500+ verified law firms, chambers, and advocates across India. Filter by city, practice area, and tier.", path: "/directory" });

  // Mode (URL-synced)
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode: Mode = searchParams.get("mode") === "startups" ? "startups" : "firms";
  const [mode, setMode] = useState<Mode>(initialMode);
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (mode === "startups") next.set("mode", "startups");
    else next.delete("mode");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [tier, setTier] = useState("");
  const [type, setType] = useState<FirmType | "">("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "map">("grid");

  // Startup-specific filters
  const [sCity, setSCity] = useState("");
  const [sSector, setSSector] = useState("");
  const [sStage, setSStage] = useState("");
  const [sSize, setSSize] = useState("");
  const [sLegal, setSLegal] = useState<"" | "yes" | "no">("");

  // Reset page on mode switch
  useEffect(() => { setPage(1); setView("grid"); }, [mode]);

  // Drawer
  const [drawerFirm, setDrawerFirm] = useState<(typeof firms)[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStartup, setDrawerStartup] = useState<Startup | null>(null);
  const [startupDrawerOpen, setStartupDrawerOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Filter areas based on selected city
  const filteredAreas = useMemo(() => {
    if (!city) return allAreas;
    return [...new Set(firms.filter((f) => f.city === city).map((f) => f.area).filter(Boolean))].sort();
  }, [city]);

  const filtered = useMemo(() => {
    return firms.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (city && f.city !== city) return false;
      if (area && f.area !== area) return false;
      if (tier && f.tier !== tier) return false;
      if (type && getType(f) !== type) return false;
      return true;
    });
  }, [search, city, area, tier, type]);

  // Sorted
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "rating-desc":
        return arr.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "tier":
        return arr.sort((a, b) => (a.tier || "").localeCompare(b.tier || ""));
      default:
        return arr;
    }
  }, [filtered, sort]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, city, area, tier, type, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Type counts
  const typeCounts = useMemo(() => {
    const base = firms.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (city && f.city !== city) return false;
      if (area && f.area !== area) return false;
      if (tier && f.tier !== tier) return false;
      return true;
    });
    return {
      "": base.length,
      "Law Firm": base.filter((f) => getType(f) === "Law Firm").length,
      Chamber: base.filter((f) => getType(f) === "Chamber").length,
      "Individual Advocate": base.filter((f) => getType(f) === "Individual Advocate").length,
    };
  }, [search, city, area, tier]);

  // City counts for map
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((f) => {
      if (f.city) counts[f.city] = (counts[f.city] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  // Active filters
  const activeFilters: { label: string; key: string; clear: () => void }[] = [];
  if (city) activeFilters.push({ label: `City: ${city}`, key: "city", clear: () => { setCity(""); setArea(""); } });
  if (area) activeFilters.push({ label: `Area: ${area}`, key: "area", clear: () => setArea("") });
  if (tier) activeFilters.push({ label: `Tier: ${tier}`, key: "tier", clear: () => setTier("") });
  if (type) activeFilters.push({ label: `Type: ${type}`, key: "type", clear: () => setType("") });

  const clearAll = useCallback(() => {
    setSearchInput(""); setCity(""); setArea(""); setTier(""); setType(""); setSort("relevance");
  }, []);

  const toggleCompare = useCallback((firm: (typeof firms)[0]) => {
    setCompareList((prev) => {
      const exists = prev.find((f) => f.name === firm.name);
      if (exists) return prev.filter((f) => f.name !== firm.name);
      if (prev.length >= 3) return prev;
      return [...prev, firm];
    });
  }, []);

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

      {/* Bar leaderboard callout */}
      <section className="container mx-auto px-4 md:px-8 mb-6">
        <Link
          to="/the-bar/leaderboard"
          className="block bg-card border-2 border-accent/40 hover:border-accent rounded-2xl p-4 md:p-5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground text-sm md:text-base">Looking for students? Check out the Bar leaderboard</p>
              <p className="text-xs md:text-sm text-muted-foreground">Students ranked by legal skill, not just college.</p>
            </div>
            <ArrowRight size={18} className="text-accent shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 md:px-8 mb-6">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search by firm name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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

          {/* Type filter pills with counts */}
          <div className="flex flex-wrap gap-2 mt-4">
            {typeFilters.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setType(tf.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                  type === tf.value
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-card text-foreground border-border hover:border-accent/40"
                }`}
              >
                {tf.label}
                <span className={`ml-1.5 text-xs ${type === tf.value ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                  ({typeCounts[tf.value]?.toLocaleString()})
                </span>
              </button>
            ))}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 animate-fade-in">
              {activeFilters.map((af) => (
                <span
                  key={af.key}
                  className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {af.label}
                  <button onClick={af.clear} className="hover:text-foreground transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 underline underline-offset-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results header: count + sort + view toggle */}
      <section className="container mx-auto px-4 md:px-8 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{sorted.length.toLocaleString()}</span> results
          </p>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView("map")}
                className={`p-2 transition-colors ${view === "map" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <MapIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 md:px-8">
        {view === "map" ? (
          <DirectoryMap cityCounts={cityCounts} selectedCity={city} onCitySelect={(c) => { setCity(c); setArea(""); }} />
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="mx-auto mb-4 opacity-40" size={48} />
            <p className="text-lg">No firms match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((f, i) => {
                const isCompared = compareList.some((c) => c.name === f.name);
                return (
                  <div
                    key={`${f.name}-${i}`}
                    className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 cursor-pointer relative animate-fade-in"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: "both" }}
                    onClick={() => { setDrawerFirm(f); setDrawerOpen(true); }}
                  >
                    {/* Compare checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCompare(f); }}
                      className={`absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs transition-all ${
                        isCompared
                          ? "bg-accent border-accent text-accent-foreground"
                          : "border-border/50 text-transparent hover:border-accent/40 group-hover:border-border"
                      }`}
                      title="Compare"
                    >
                      {isCompared && <GitCompareArrows size={12} />}
                    </button>

                    <div className="flex items-start justify-between gap-2 mb-3 pr-8">
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
                      <span className="text-[11px] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {getType(f)}
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
                          <span className="truncate">{f.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Firm detail drawer */}
      <FirmDrawer
        firm={drawerFirm}
        type={drawerFirm ? getType(drawerFirm) : "Law Firm"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Compare bar */}
      <CompareBar
        selected={compareList}
        onRemove={(name) => setCompareList((prev) => prev.filter((f) => f.name !== name))}
        onClear={() => setCompareList([])}
      />

      {/* Spacer for compare bar */}
      {compareList.length > 0 && <div className="h-20" />}
    </main>
  );
}
