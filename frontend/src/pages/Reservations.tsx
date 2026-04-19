import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { CalendarClock } from "lucide-react";
import { BookCover } from "@/components/BookCover";
import { toast } from "sonner";

interface ApiReservation {
  id: number;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  reservedAt: string;
  book: { id: number; title: string; author: string; cover_url?: string };
}

interface ReservationsEnvelope {
  success: boolean;
  data: ApiReservation[];
}

interface Reservation {
  id: string;
  book: { id: string; title: string; author: string; cover_url?: string };
  reserved_at: string;
  status: "pending" | "cancelled" | "reserved";
}

const Reservations = () => {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ReservationsEnvelope>(endpoints.reservations.mine);

      const mapped = (data.data || []).map((reservation) => ({
        id: String(reservation.id),
        book: {
          id: String(reservation.book.id),
          title: reservation.book.title,
          author: reservation.book.author,
          cover_url: reservation.book.cover_url,
        },
        reserved_at: reservation.reservedAt,
        status:
          reservation.status === "PENDING"
            ? "pending"
            : reservation.status === "CANCELLED"
              ? "cancelled"
              : "reserved",
      })) as Reservation[];

      setItems(mapped);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (r: Reservation) => {
    try {
      await api.delete(endpoints.reservations.cancel(r.id));
      toast.success("Reservation cancelled.");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not cancel reservation.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Your reservations</h2>
        <p className="text-sm text-muted-foreground">Books waiting to be picked up.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No active reservations" description="Reserve a book from the catalogue and it will appear here." />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card-lift flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
                <BookCover src={r.book.cover_url} alt={r.book.title} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{r.book.title}</h3>
                <p className="truncate text-sm text-muted-foreground">{r.book.author}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reserved {new Date(r.reserved_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={r.status === "pending" ? "pending" : r.status === "cancelled" ? "cancelled" : "reserved"} />
              <Button variant="outline" size="sm" onClick={() => cancel(r)}>Cancel</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservations;
