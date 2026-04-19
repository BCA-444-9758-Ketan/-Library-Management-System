import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { BookOpen, BookMarked, CalendarClock, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { BookCover } from "@/components/BookCover";

interface Stats { totalBooks: number; activeLoans: number; reservations: number; overdue: number; }
interface WeekPoint { day: string; issued: number; }
interface CategorySlice { name: string; value: number; }
interface Txn { id: string; user: string; book: string; action: string; status: string; date: string; }
interface Recommendation { id: string; title: string; author: string; cover_url?: string; }

interface ApiBook {
  id: number;
  category: string;
}

interface ApiTransaction {
  id: number;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
  issuedAt: string;
  dueDate: string;
  createdAt: string;
  book?: { title: string; author?: string };
  user?: { name: string };
}

interface ApiReservation {
  id: number;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
}

interface ApiRecommendation {
  id: number;
  title: string;
  author: string;
}

const COLORS = ["hsl(224 76% 40%)", "hsl(217 91% 60%)", "hsl(199 89% 48%)", "hsl(187 85% 53%)", "hsl(238 75% 65%)"];

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) => (
  <div className="card-lift rounded-xl border border-primary/15 bg-card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ?? "bg-secondary text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [weekly, setWeekly] = useState<WeekPoint[]>([]);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [recent, setRecent] = useState<Txn[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let alive = true;

    const buildWeekly = (transactions: ApiTransaction[]): WeekPoint[] => {
      const now = new Date();
      const days: WeekPoint[] = [];

      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        days.push({
          day: date.toLocaleDateString(undefined, { weekday: "short" }),
          issued: 0,
        });
      }

      transactions.forEach((transaction) => {
        const txDate = new Date(transaction.issuedAt);
        const dayLabel = txDate.toLocaleDateString(undefined, { weekday: "short" });
        const bucket = days.find((point) => point.day === dayLabel);
        if (bucket) {
          bucket.issued += 1;
        }
      });

      return days;
    };

    const load = async () => {
      try {
        const transactionsEndpoint =
          user.role === "admin" || user.role === "librarian"
            ? endpoints.transactions.all
            : endpoints.loans.mine;

        const [booksResp, transactionsResp, reservationsResp, recommendationsResp] = await Promise.allSettled([
          api.get(endpoints.books.list, { params: { page: 1, limit: 100 } }),
          api.get(transactionsEndpoint, { params: { page: 1, limit: 100 } }),
          api.get(endpoints.reservations.mine),
          api.get(endpoints.recommendations(user.id)),
        ]);

        if (!alive) return;

        const books: ApiBook[] =
          booksResp.status === "fulfilled" ? booksResp.value.data?.data || [] : [];

        const totalBooks: number =
          booksResp.status === "fulfilled"
            ? booksResp.value.data?.pagination?.total || books.length
            : books.length;

        const transactions: ApiTransaction[] =
          transactionsResp.status === "fulfilled" ? transactionsResp.value.data?.data || [] : [];

        const reservations: ApiReservation[] =
          reservationsResp.status === "fulfilled" ? reservationsResp.value.data?.data || [] : [];

        const recommendationsPayload: ApiRecommendation[] =
          recommendationsResp.status === "fulfilled"
            ? recommendationsResp.value.data?.data?.recommendations || []
            : [];

        const overdueCount = transactions.filter((tx) => {
          if (tx.status === "OVERDUE") return true;
          if (tx.status !== "ISSUED") return false;
          return new Date(tx.dueDate).getTime() < Date.now();
        }).length;

        const categoryCount = books.reduce<Record<string, number>>((acc, book) => {
          acc[book.category] = (acc[book.category] || 0) + 1;
          return acc;
        }, {});

        const categoryData = Object.entries(categoryCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        const recentTxns: Txn[] = transactions
          .slice(0, 8)
          .map((tx) => ({
            id: String(tx.id),
            user: tx.user?.name || user.name,
            book: tx.book?.title || "Unknown book",
            action: tx.status,
            status: tx.status.toLowerCase(),
            date: tx.issuedAt || tx.createdAt,
          }));

        const mappedRecs: Recommendation[] = recommendationsPayload.slice(0, 4).map((item) => ({
          id: String(item.id),
          title: item.title,
          author: item.author,
          cover_url: undefined,
        }));

        setStats({
          totalBooks,
          activeLoans: transactions.filter((tx) => tx.status === "ISSUED").length,
          reservations: reservations.filter((entry) => entry.status === "PENDING").length,
          overdue: overdueCount,
        });
        setWeekly(buildWeekly(transactions));
        setCategories(categoryData);
        setRecent(recentTxns);
        setRecs(mappedRecs);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [user?.id, user?.name, user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋</h2>
        <p className="text-sm text-muted-foreground">Here's what's happening in your library today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard icon={BookOpen} label="Total Books" value={stats?.totalBooks ?? 0} />
            <StatCard icon={BookMarked} label="Active Loans" value={stats?.activeLoans ?? 0} accent="bg-success/10 text-success" />
            <StatCard icon={CalendarClock} label="Reservations" value={stats?.reservations ?? 0} accent="bg-primary-glow/10 text-primary-glow" />
            <StatCard icon={AlertCircle} label="Overdue" value={stats?.overdue ?? 0} accent="bg-destructive/10 text-destructive" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-lift rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Books issued this week</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="day" stroke="hsl(215 16% 47%)" fontSize={12} />
                  <YAxis stroke="hsl(215 16% 47%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(214 32% 91%)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="issued" stroke="hsl(224 76% 40%)" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-lift rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Books by category</h3>
          <div className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(214 32% 91%)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent txns + recs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-lift rounded-xl border border-border bg-card lg:col-span-2">
          <div className="border-b border-border p-5">
            <h3 className="font-semibold">Recent transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                )) : recent.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No recent activity.</td></tr>
                ) : recent.map((t, i) => (
                  <tr key={t.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="px-5 py-3 font-medium">{t.user}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.book}</td>
                    <td className="px-5 py-3"><StatusBadge status={(t.status as any) ?? "issued"} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-lift rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">My Recommendations</h3>
          </div>
          <div className="space-y-3">
            {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
              : recs.length === 0 ? <p className="text-sm text-muted-foreground">No recommendations yet.</p>
              : recs.map((b) => (
                <div key={b.id} className="flex gap-3 rounded-lg border border-border p-2 transition hover:border-primary/40">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
                    <BookCover src={b.cover_url} alt={b.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.author}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
