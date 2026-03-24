import { useState, useMemo } from "react";
import { Search, Building2, MapPin, Star } from "lucide-react";
import firms from "@/data/firms.json";

const allStates = [...new Set(firms.map((f) => f.state))].sort();
const allCities = [...new Set(firms.map((f) => f.city))].sort();
const allTypes = [...new Set(firms.map((f) => f.type))].sort();
const allTiers = [1, 2, 3];

export default function Directory() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [tier, setTier] = useState("");

  const filtered = useMemo(() => {
    return firms.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (state && f.state !== state) return false;
      if (city && f.city !== city) return false;
      if (type && f.type !== type) return false;
      if (tier && f.tier !== Number(tier)) return false;
      return true;
    });
  }, [search, state, city, type, tier]);

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
          Explore opportunities across India's top law firms, litigation chambers, corporate legal teams, and legal-tech startups.
        </p>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 md:px-8 mb-10">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              />
            </div>
            <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
              <option value="">All States</option>
              {allStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
              <option value="">All Cities</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              <option value="">All Types</option>
              {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectClass}>
              <option value="">All Tiers</option>
              {allTiers.map((t) => <option key={t} value={String(t)}>Tier {t}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 md:px-8">
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filtered.length} of {firms.length} results
        </p>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="mx-auto mb-4 opacity-40" size={48} />
            <p className="text-lg">No firms match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((f, i) => (
              <div
                key={i}
                className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-heading text-lg font-bold leading-tight group-hover:text-accent transition-colors">
                    {f.name}
                  </h3>
                  <span className="flex items-center gap-1 text-xs font-semibold bg-accent/10 text-accent px-2 py-1 rounded-full whitespace-nowrap">
                    <Star size={12} /> Tier {f.tier}
                  </span>
                </div>
                <span className="inline-block text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full mb-3">
                  {f.type}
                </span>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {f.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={13} />
                  {f.city}, {f.state}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
