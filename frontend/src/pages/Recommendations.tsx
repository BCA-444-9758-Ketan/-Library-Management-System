import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles } from "lucide-react";
import { BookCover } from "@/components/BookCover";

interface ApiRecommendation {
  id: number;
  title: string;
  author: string;
  category: string;
  reason?: string;
  availability?: Array<{ branchName: string; availableQuantity: number }>;
}

interface RecommendationsEnvelope {
  success: boolean;
  data: {
    recommendations: ApiRecommendation[];
  };
}

interface Recommendation {
  id: string;
  title: string;
  author: string;
  category: string;
  reason?: string;
  cover_url?: string;
  match?: number;
}

const Recommendations = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setRecs([]);
      return;
    }

    api
      .get<RecommendationsEnvelope>(endpoints.recommendations(user.id))
      .then(({ data }) => {
        const mapped = (data.data?.recommendations || []).map((item) => ({
          id: String(item.id),
          title: item.title,
          author: item.author,
          category: item.category,
          reason: item.reason,
          match: undefined,
          cover_url: undefined,
        })) as Recommendation[];

        setRecs(mapped);
      })
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const grouped = recs.reduce<Record<string, Recommendation[]>>((acc, b) => {
    const key = b.category || "Recommended";
    (acc[key] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Picked For You</h2>
        <p className="text-sm text-muted-foreground">Curated based on what you've read and loved.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-5 w-40" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-60 w-40 shrink-0 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : recs.length === 0 ? (
        <EmptyState icon={Sparkles} title="No recommendations yet" description="Borrow a few books and we'll start suggesting." />
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h3 className="mb-3 font-semibold">{cat}</h3>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
              {items.map((b) => (
                <div key={b.id} className="card-lift w-44 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    <BookCover src={b.cover_url} alt={b.title} />
                    {typeof b.match === "number" && (
                      <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                        {b.match}% match
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold">{b.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
                    {b.reason && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{b.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default Recommendations;
