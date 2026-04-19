import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { UserCircle2 } from "lucide-react";

interface ActiveTransaction {
  id: number;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
  issuedAt: string;
  dueDate: string;
  fineAmount?: number | null;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
  };
  branch: {
    id: number;
    name: string;
    location: string;
  };
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  borrowingLimit: number;
  createdAt: string;
  transactions: ActiveTransaction[];
}

interface UserProfileEnvelope {
  success: boolean;
  data: UserProfile;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    api
      .get<UserProfileEnvelope>(endpoints.usersProfile(user.id))
      .then(({ data }) => setProfile(data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return <EmptyState icon={UserCircle2} title="Profile unavailable" description="Could not load your profile right now." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">Profile details</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{profile.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{profile.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium capitalize text-foreground">{profile.role.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Borrowing limit</p>
            <p className="font-medium text-foreground">{profile.borrowingLimit}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-semibold">Active issued books</h3>
          <p className="text-sm text-muted-foreground">Live data from your user profile endpoint.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No active issued books.
                  </td>
                </tr>
              ) : (
                profile.transactions.map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 ? "bg-muted/30" : ""}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{tx.book.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.book.author}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{tx.branch.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(tx.issuedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(tx.dueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status.toLowerCase() as "issued" | "overdue" | "returned"}>
                        {tx.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Profile;
