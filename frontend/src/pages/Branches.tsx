import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Building2, MapPin, BookOpen } from "lucide-react";

interface ApiBranch {
  id: number;
  name: string;
  location: string;
  _count?: {
    inventory?: number;
  };
}

interface BranchesEnvelope {
  success: boolean;
  data: ApiBranch[];
}

interface Branch {
  id: string;
  name: string;
  location: string;
  image_url?: string;
  books_available: number;
}

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<BranchesEnvelope>(endpoints.branches)
      .then(({ data }) => {
        const mapped = (data.data || []).map((branch) => ({
          id: String(branch.id),
          name: branch.name,
          location: branch.location,
          books_available: branch._count?.inventory || 0,
        })) as Branch[];

        setBranches(mapped);
      })
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Our branches</h2>
        <p className="text-sm text-muted-foreground">CIMAGE library locations across Patna.</p>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState icon={Building2} title="No branches yet" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <div key={b.id} className="card-lift overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[16/10] overflow-hidden bg-secondary">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center gradient-soft">
                    <Building2 className="h-16 w-16 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{b.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {b.location}
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">{b.books_available.toLocaleString()}</span>
                  <span className="text-muted-foreground">books available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Branches;
