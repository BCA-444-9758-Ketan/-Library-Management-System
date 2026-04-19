import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, endpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, BookOpen, PlusCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { BookCover } from "@/components/BookCover";
import { toast } from "sonner";

interface ApiBranch {
  id: number;
  name: string;
  location: string;
}

interface ApiInventory {
  id: number;
  branchId: number;
  totalQuantity: number;
  availableQuantity: number;
  branch: ApiBranch;
}

interface ApiBook {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  description?: string;
  publishedYear?: number;
  inventory: ApiInventory[];
}

interface BooksEnvelope {
  success: boolean;
  data: ApiBook[];
}

interface BookDetailEnvelope {
  success: boolean;
  data: ApiBook;
}

interface ApiAvailability {
  branchId: number;
  branchName: string;
  location: string;
  totalQuantity: number;
  availableQuantity: number;
}

interface AvailabilityEnvelope {
  success: boolean;
  data: ApiAvailability[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  branch?: string;
  available: boolean;
  cover_url?: string;
  isbn?: string;
  description?: string;
  published_year?: number;
  total_copies?: number;
  available_copies?: number;
  branch_availability?: { branchId: string; branch: string; location: string; available: number; total: number }[];
}

interface CreateBookForm {
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  publishedYear: string;
}

const defaultCreateBookForm: CreateBookForm = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  description: "",
  publishedYear: "",
};

const Books = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<string>(params.get("category") ?? "all");
  const [branch, setBranch] = useState<string>(params.get("branch") ?? "all");
  const [availability, setAvailability] = useState<string>(params.get("availability") ?? "all");
  const [selected, setSelected] = useState<Book | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateBookForm>(defaultCreateBookForm);

  const canCreateBooks = user?.role === "admin" || user?.role === "librarian";

  const mapBook = useCallback((book: ApiBook): Book => {
    const branchAvailability = (book.inventory || []).map((entry) => ({
      branchId: String(entry.branchId),
      branch: entry.branch.name,
      location: entry.branch.location,
      available: entry.availableQuantity,
      total: entry.totalQuantity,
    }));

    const availableCopies = branchAvailability.reduce((sum, item) => sum + item.available, 0);
    const totalCopies = branchAvailability.reduce((sum, item) => sum + item.total, 0);
    const primaryBranch =
      branchAvailability.find((item) => item.available > 0)?.branch || branchAvailability[0]?.branch;

    return {
      id: String(book.id),
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      description: book.description,
      published_year: book.publishedYear,
      available: availableCopies > 0,
      branch: primaryBranch,
      total_copies: totalCopies,
      available_copies: availableCopies,
      branch_availability: branchAvailability,
    };
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<BooksEnvelope>(endpoints.books.list, {
        params: { page: 1, limit: 100 },
      });
      setBooks((data.data || []).map(mapBook));
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [mapBook]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))], [books]);
  const branches = useMemo(() => ["all", ...Array.from(new Set(books.map((b) => b.branch).filter(Boolean) as string[]))], [books]);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      if (q && !`${b.title} ${b.author}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (category !== "all" && b.category !== category) return false;
      if (branch !== "all" && !b.branch_availability?.some((item) => item.branch === branch)) return false;
      if (availability === "available" && !b.available) return false;
      if (availability === "unavailable" && b.available) return false;
      return true;
    });
  }, [books, q, category, branch, availability]);

  const openDetail = async (bookId: string) => {
    const preview = books.find((book) => book.id === bookId) || null;
    setSelected(preview);
    setDetailLoading(true);

    try {
      const [detailResp, availabilityResp] = await Promise.all([
        api.get<BookDetailEnvelope>(endpoints.books.detail(bookId)),
        api.get<AvailabilityEnvelope>(endpoints.books.availability(bookId)),
      ]);

      const detailed = mapBook(detailResp.data.data);
      const availabilityRows = (availabilityResp.data.data || []).map((entry) => ({
        branchId: String(entry.branchId),
        branch: entry.branchName,
        location: entry.location,
        available: entry.availableQuantity,
        total: entry.totalQuantity,
      }));

      const availableCopies = availabilityRows.reduce((sum, item) => sum + item.available, 0);
      const totalCopies = availabilityRows.reduce((sum, item) => sum + item.total, 0);

      setSelected({
        ...detailed,
        branch_availability: availabilityRows.length ? availabilityRows : detailed.branch_availability,
        available_copies: availabilityRows.length ? availableCopies : detailed.available_copies,
        total_copies: availabilityRows.length ? totalCopies : detailed.total_copies,
        available: availabilityRows.length ? availableCopies > 0 : detailed.available,
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not load book details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleIssue = async (book: Book) => {
    const sourceBranch = book.branch_availability?.find((entry) => entry.available > 0);

    if (!sourceBranch) {
      toast.error("No available copies right now. Please place a reservation.");
      return;
    }

    try {
      await api.post(endpoints.books.issue, {
        bookId: Number(book.id),
        branchId: Number(sourceBranch.branchId),
      });
      toast.success(`"${book.title}" has been issued.`);
      setSelected(null);
      await loadBooks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not issue this book.");
    }
  };

  const handleReserve = async (book: Book) => {
    const reserveBranch =
      book.branch_availability?.find((entry) => entry.available === 0) || book.branch_availability?.[0];

    if (!reserveBranch) {
      toast.error("No branch inventory found for this book.");
      return;
    }

    try {
      await api.post(endpoints.reservations.create, {
        bookId: Number(book.id),
        branchId: Number(reserveBranch.branchId),
      });
      toast.success(`"${book.title}" reserved.`);
      setSelected(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reserve this book.");
    }
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateBooks) return;

    const yearValue = createForm.publishedYear.trim();
    const yearNumber = yearValue ? Number(yearValue) : undefined;

    if (yearValue && (!Number.isInteger(yearNumber) || Number(yearNumber) < 1000)) {
      toast.error("Published year should be a valid year.");
      return;
    }

    setCreating(true);
    try {
      await api.post(endpoints.books.create, {
        title: createForm.title.trim(),
        author: createForm.author.trim(),
        isbn: createForm.isbn.trim(),
        category: createForm.category.trim(),
        description: createForm.description.trim() || undefined,
        publishedYear: yearNumber,
      });
      toast.success("Book created successfully.");
      setCreateForm(defaultCreateBookForm);
      await loadBooks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not create book.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or author…"
              value={q}
              onChange={(e) => { setQ(e.target.value); updateParam("q", e.target.value); }}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); updateParam("category", v); }}>
            <SelectTrigger className="lg:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={branch} onValueChange={(v) => { setBranch(v); updateParam("branch", v); }}>
            <SelectTrigger className="lg:w-40"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b === "all" ? "All branches" : b}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={availability} onValueChange={(v) => { setAvailability(v); updateParam("availability", v); }}>
            <SelectTrigger className="lg:w-40"><SelectValue placeholder="Availability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {canCreateBooks && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Add new book</h2>
          </div>
          <form onSubmit={handleCreateBook} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="book-title">Title</Label>
              <Input
                id="book-title"
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-author">Author</Label>
              <Input
                id="book-author"
                value={createForm.author}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, author: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-isbn">ISBN</Label>
              <Input
                id="book-isbn"
                value={createForm.isbn}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, isbn: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-category">Category</Label>
              <Input
                id="book-category"
                value={createForm.category}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-year">Published year (optional)</Label>
              <Input
                id="book-year"
                type="number"
                min={1000}
                max={new Date().getFullYear()}
                value={createForm.publishedYear}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, publishedYear: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="book-description">Description (optional)</Label>
              <Textarea
                id="book-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create book
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books found" description="Try changing your filters or search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => openDetail(b.id)}
              className="card-lift cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                <BookCover src={b.cover_url} alt={b.title} />
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                    {b.category}
                  </span>
                  <StatusBadge status={b.available ? "available" : "reserved"}>
                    {b.available ? "Available" : "On loan"}
                  </StatusBadge>
                </div>
                <h3 className="line-clamp-1 font-semibold">{b.title}</h3>
                <p className="line-clamp-1 text-sm text-muted-foreground">{b.author}</p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  disabled={!b.available}
                  onClick={(e) => { e.stopPropagation(); handleIssue(b); }}
                >
                  {b.available ? "Issue" : "Unavailable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>by {selected.author}</DialogDescription>
              </DialogHeader>
              {detailLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                  <div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-secondary">
                    <BookCover src={selected.cover_url} alt={selected.title} />
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-primary">{selected.category}</span>
                      {selected.isbn && <span className="rounded-md border border-border px-2 py-0.5 text-xs">ISBN: {selected.isbn}</span>}
                      {selected.published_year && (
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs">Year: {selected.published_year}</span>
                      )}
                      <StatusBadge status={selected.available ? "available" : "reserved"}>
                        {selected.available ? "Available" : "On loan"}
                      </StatusBadge>
                    </div>
                    {selected.description && <p className="text-muted-foreground">{selected.description}</p>}

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch availability</p>
                      {selected.branch_availability?.length ? (
                        <ul className="divide-y divide-border rounded-md border border-border">
                          {selected.branch_availability.map((ba) => (
                            <li key={ba.branchId} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span>
                                {ba.branch}
                                <span className="ml-1 text-xs text-muted-foreground">({ba.location})</span>
                              </span>
                              <span className="font-medium">{ba.available}/{ba.total}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">{selected.branch ?? "Branch info unavailable"}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleReserve(selected)}>Reserve</Button>
                <Button onClick={() => handleIssue(selected)} disabled={!selected.available}>Issue book</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Books;
