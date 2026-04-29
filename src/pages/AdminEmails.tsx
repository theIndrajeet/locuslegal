import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Row {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  pending: number;
}

const RANGES = [
  { label: "24h", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
];

const STATUS_BADGE: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  suppressed: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  dlq: "bg-red-500/15 text-red-500 border-red-500/30",
  failed: "bg-red-500/15 text-red-500 border-red-500/30",
  bounced: "bg-red-500/15 text-red-500 border-red-500/30",
  complained: "bg-red-500/15 text-red-500 border-red-500/30",
};

const PAGE = 50;

export default function AdminEmails() {
  usePageMeta({
    title: "Admin · Email Log — Locus",
    description: "Email delivery health for Locus.",
    path: "/admin/emails",
  });

  const [rangeDays, setRangeDays] = useState(7);
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 });
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("admin-email-log", {
      body: {
        rangeDays,
        template: template === "all" ? null : template,
        status: status === "all" ? null : status,
        limit: PAGE,
        offset,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const r = data as { rows: Row[]; stats: Stats; templates: string[] };
    setRows(r.rows ?? []);
    setStats(r.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 });
    setTemplates(r.templates ?? []);
    setLoading(false);
  }, [rangeDays, template, status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setOffset(0);
  }, [rangeDays, template, status]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Console
          </p>
          <h1 className="font-heading text-3xl font-black">Email Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deduped by message_id. Latest status per email.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {/* Filters */}
      <section className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))] mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRangeDays(r.value)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-foreground transition ${
                rangeDays === r.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="min-w-[180px]">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Template
          </label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="border-2 border-foreground h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-2 border-foreground h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dlq">Failed (dlq)</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total unique" value={stats.total} />
        <Stat label="Sent" value={stats.sent} tone="emerald" />
        <Stat label="Failed" value={stats.failed} tone="red" />
        <Stat label="Suppressed" value={stats.suppressed} tone="amber" />
      </section>

      {/* Table */}
      {error ? (
        <div className="border-2 border-red-500/40 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="border-2 border-dashed border-foreground/30 p-12 text-center text-muted-foreground">
          No email logs in this range.
        </div>
      ) : (
        <div className="border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground bg-muted/40 text-left">
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest">Template</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest">Recipient</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest">Status</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest">When</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-foreground/10 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.template_name}</td>
                  <td className="p-3 font-mono text-xs truncate max-w-[220px]">{r.recipient_email}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        STATUS_BADGE[r.status] ?? "bg-muted text-muted-foreground border-foreground/20"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs text-red-500 max-w-[260px] truncate" title={r.error_message ?? ""}>
                    {r.error_message ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {stats.total > PAGE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + PAGE, stats.total)} of {stats.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE >= stats.total}
              onClick={() => setOffset(offset + PAGE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "red" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-500"
      : tone === "red"
      ? "text-red-500"
      : tone === "amber"
      ? "text-amber-500"
      : "";
  return (
    <div className="border-2 border-foreground bg-card p-3 shadow-[3px_3px_0_0_hsl(var(--foreground))]">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`font-heading text-2xl font-black leading-none ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
