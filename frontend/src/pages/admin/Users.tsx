import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users as UsersIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toUiRole } from "@/lib/api";

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  _count?: {
    transactions?: number;
  };
}

interface UsersEnvelope {
  success: boolean;
  data: ApiUser[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "librarian" | "admin";
  active_loans: number;
  created_at?: string;
}

const roleStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  librarian: "bg-primary-glow/10 text-primary-glow border-primary-glow/20",
  student: "bg-secondary text-secondary-foreground border-border",
};

const Users = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get<UsersEnvelope>(endpoints.users, {
      params: { page: 1, limit: 200 },
    })
      .then(({ data }) => {
        const mapped = (data.data || []).map((user) => ({
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: toUiRole(user.role),
          active_loans: user._count?.transactions || 0,
          created_at: user.createdAt,
        })) as AdminUser[];

        setUsers(mapped);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">All registered library accounts.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Active loans</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10">
                  <EmptyState icon={UsersIcon} title="No users found" />
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className={i % 2 ? "bg-muted/30" : ""}>
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", roleStyles[u.role])}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">{u.active_loans}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
