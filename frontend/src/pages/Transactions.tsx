import { useCallback, useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ClipboardList } from "lucide-react";

interface ApiTransaction {
  id: number;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount?: number | null;
  book: {
    id: number;
    title: string;
    author: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  branch: {
    id: number;
    name: string;
    location: string;
  };
}

interface TransactionsEnvelope {
  success: boolean;
  data: ApiTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const Transactions = () => {
  const [items, setItems] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<TransactionsEnvelope>(endpoints.transactions.all, {
        params: {
          page,
          limit: pagination.limit,
          status: status === "all" ? undefined : status,
          userId: userId.trim() ? Number(userId) : undefined,
        },
      });

      setItems(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setItems([]);
      setPagination({ total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, status, userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const effectiveStatus = (tx: ApiTransaction) => {
    if (tx.status === "OVERDUE") return "overdue" as const;
    if (tx.status === "ISSUED" && new Date(tx.dueDate).getTime() < Date.now()) return "overdue" as const;
    return tx.status.toLowerCase() as "issued" | "returned";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Transactions ledger</h2>
          <p className="text-sm text-muted-foreground">Admin and librarian view for all issue and return records.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Status</p>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">User ID</p>
            <Input
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value.replace(/[^0-9]/g, ""));
                setPage(1);
              }}
              placeholder="Filter by user id"
            />
          </div>

          <div className="md:col-span-2 flex items-end justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setStatus("all");
              setUserId("");
              setPage(1);
            }}>
              Reset filters
            </Button>
            <Button onClick={loadTransactions}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <th className="px-5 py-3">Transaction</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={7} className="px-5 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10">
                    <EmptyState icon={ClipboardList} title="No transactions found" description="Try changing your filters." />
                  </td>
                </tr>
              ) : (
                items.map((tx, index) => (
                  <tr key={tx.id} className={index % 2 ? "bg-muted/30" : ""}>
                    <td className="px-5 py-3 font-medium">#{tx.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{tx.user.name}</p>
                      <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{tx.book.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.book.author}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{tx.branch.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(tx.issuedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(tx.dueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={effectiveStatus(tx)}>
                        {effectiveStatus(tx).toUpperCase()}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={pagination.page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
