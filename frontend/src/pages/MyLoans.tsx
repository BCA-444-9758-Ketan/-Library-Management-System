import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { BookOpen, CalendarClock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApiTransaction {
  id: number;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount?: number;
  book: { id: number; title: string; author: string; cover_url?: string };
}

interface TransactionsEnvelope {
  success: boolean;
  data: ApiTransaction[];
}

interface Loan {
  id: string;
  book: { id: string; title: string; author: string; cover_url?: string };
  issued_at: string;
  due_at: string;
  returned_at?: string | null;
  fine_amount?: number;
  status?: "active" | "overdue" | "returned";
}

const daysBetween = (a: Date, b: Date) => Math.ceil((a.getTime() - b.getTime()) / 86400000);

const MyLoans = () => {
  const [active, setActive] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<TransactionsEnvelope>(endpoints.loans.mine);

      const mapped = (data.data || []).map((tx) => {
        const due = new Date(tx.dueDate);
        const isOverdueActive = tx.status === "ISSUED" && due.getTime() < Date.now();

        return {
          id: String(tx.id),
          book: {
            id: String(tx.book.id),
            title: tx.book.title,
            author: tx.book.author,
            cover_url: tx.book.cover_url,
          },
          issued_at: tx.issuedAt,
          due_at: tx.dueDate,
          returned_at: tx.returnedAt,
          fine_amount: tx.fineAmount,
          status: tx.status === "RETURNED" ? "returned" : isOverdueActive ? "overdue" : "active",
        } as Loan;
      });

      setActive(mapped.filter((tx) => tx.status !== "returned"));
      setHistory(mapped.filter((tx) => tx.status === "returned"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleReturn = async (loan: Loan) => {
    try {
      await api.post(endpoints.loans.return, { transactionId: Number(loan.id) });
      toast.success(`Returned "${loan.book.title}".`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not return this book.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Active loans */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Active loans</h2>
          <p className="text-sm text-muted-foreground">Books you currently have checked out.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : active.length === 0 ? (
          <EmptyState icon={BookOpen} title="No active loans" description="When you borrow a book it will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((loan) => {
              const due = new Date(loan.due_at);
              const days = daysBetween(due, new Date());
              const overdue = days < 0;
              return (
                <div
                  key={loan.id}
                  className={cn(
                    "card-lift rounded-xl border bg-card p-5",
                    overdue ? "border-destructive/40" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{loan.book.title}</h3>
                      <p className="truncate text-sm text-muted-foreground">{loan.book.author}</p>
                    </div>
                    <StatusBadge status={overdue ? "overdue" : "active"}>
                      {overdue ? "Overdue" : "Active"}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    {overdue ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CalendarClock className="h-4 w-4 text-primary" />
                    )}
                    <span className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {overdue
                        ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
                        : `Due in ${days} day${days === 1 ? "" : "s"}`}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{due.toLocaleDateString()}</span>
                  </div>
                  <Button size="sm" className="mt-4 w-full" onClick={() => handleReturn(loan)}>
                    Return book
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Loan history</h2>
          <p className="text-sm text-muted-foreground">Your past borrowings.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3">Returned</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                )) : history.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No history yet.</td></tr>
                ) : history.map((l, i) => (
                  <tr key={l.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="px-5 py-3 font-medium">{l.book.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.book.author}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(l.issued_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.returned_at ? new Date(l.returned_at).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={(l.status ?? "returned") as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyLoans;
