import { useEffect, useMemo, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText } from "lucide-react";

interface ApiAuditEntry {
  id: number;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  userName?: string;
}

interface AuditEnvelope {
  success: boolean;
  data: ApiAuditEntry[];
}

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  details?: string;
  timestamp: string;
}

const AuditLog = () => {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [action, setAction] = useState("all");

  useEffect(() => {
    api.get<AuditEnvelope>(endpoints.auditLog, {
      params: { page: 1, limit: 200 },
    })
      .then(({ data }) => {
        const mapped = (data.data || []).map((entry) => ({
          id: String(entry.id),
          user: entry.userName || "System",
          action: entry.action,
          details: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
          timestamp: entry.createdAt,
        })) as AuditEntry[];

        setItems(mapped);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => ["all", ...Array.from(new Set(items.map((i) => i.action)))], [items]);

  const filtered = items.filter((i) => {
    if (action !== "all" && i.action !== action) return false;
    if (date && new Date(i.timestamp).toISOString().slice(0, 10) !== date) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Audit log</h2>
          <p className="text-sm text-muted-foreground">All system activity, fully traceable.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{actions.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10">
                  <EmptyState icon={ScrollText} title="No audit entries" description="Try changing your filters." />
                </td></tr>
              ) : filtered.map((i, idx) => (
                <tr key={i.id} className={idx % 2 ? "bg-muted/30" : ""}>
                  <td className="px-5 py-3 font-medium">{i.user}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-primary">{i.action}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{i.details ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(i.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
