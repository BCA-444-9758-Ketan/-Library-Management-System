import { useCallback, useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Boxes, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface ApiBookRef {
  id: number;
  title: string;
}

interface ApiBranchRef {
  id: number;
  name: string;
  location: string;
}

interface ApiInventoryRow {
  id: number;
  totalQuantity: number;
  availableQuantity: number;
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

interface PaginatedEnvelope<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface NonPaginatedEnvelope<T> {
  success: boolean;
  data: T[];
}

const Inventory = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ApiInventoryRow[]>([]);
  const [books, setBooks] = useState<ApiBookRef[]>([]);
  const [branches, setBranches] = useState<ApiBranchRef[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const [bookFilter, setBookFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [addingStock, setAddingStock] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [addBookId, setAddBookId] = useState("");
  const [addBranchId, setAddBranchId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");

  const [transferBookId, setTransferBookId] = useState("");
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("1");

  const canAddStock = user?.role === "admin";
  const canTransfer = user?.role === "admin" || user?.role === "librarian";

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedEnvelope<ApiInventoryRow>>(endpoints.inventory.list, {
        params: {
          page,
          limit: pagination.limit,
          bookId: bookFilter === "all" ? undefined : Number(bookFilter),
          branchId: branchFilter === "all" ? undefined : Number(branchFilter),
        },
      });
      setRows(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setRows([]);
      setPagination({ total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [bookFilter, branchFilter, page, pagination.limit]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [booksResp, branchesResp] = await Promise.all([
          api.get<PaginatedEnvelope<ApiBookRef>>(endpoints.books.list, { params: { page: 1, limit: 200 } }),
          api.get<NonPaginatedEnvelope<ApiBranchRef>>(endpoints.branches),
        ]);

        setBooks(booksResp.data.data || []);
        setBranches(branchesResp.data.data || []);
      } catch {
        setBooks([]);
        setBranches([]);
      }
    };

    loadReferences();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddStock) return;

    const quantity = Number(addQuantity);
    if (!addBookId || !addBranchId || !Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Please provide valid stock details.");
      return;
    }

    setAddingStock(true);
    try {
      await api.post(endpoints.inventory.add, {
        bookId: Number(addBookId),
        branchId: Number(addBranchId),
        quantity,
      });
      toast.success("Stock added successfully.");
      setAddBookId("");
      setAddBranchId("");
      setAddQuantity("1");
      await loadInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not add stock.");
    } finally {
      setAddingStock(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canTransfer) return;

    const quantity = Number(transferQuantity);
    if (!transferBookId || !fromBranchId || !toBranchId || !Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Please provide valid transfer details.");
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error("Source and destination branches must be different.");
      return;
    }

    setTransferring(true);
    try {
      await api.patch(endpoints.inventory.transfer, {
        bookId: Number(transferBookId),
        fromBranchId: Number(fromBranchId),
        toBranchId: Number(toBranchId),
        quantity,
      });
      toast.success("Stock transferred successfully.");
      setTransferBookId("");
      setFromBranchId("");
      setToBranchId("");
      setTransferQuantity("1");
      await loadInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not transfer stock.");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Inventory management</h2>
        <p className="text-sm text-muted-foreground">Track, add, and transfer stock across branches.</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Book</p>
            <Select
              value={bookFilter}
              onValueChange={(value) => {
                setBookFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All books" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All books</SelectItem>
                {books.map((book) => (
                  <SelectItem key={book.id} value={String(book.id)}>{book.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Branch</p>
            <Select
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setBookFilter("all");
              setBranchFilter("all");
              setPage(1);
            }}>
              Reset filters
            </Button>
            <Button onClick={loadInventory}>Refresh</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {canAddStock && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="font-semibold">Add stock (Admin)</h3>
            <form onSubmit={handleAddStock} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Book</Label>
                <Select value={addBookId} onValueChange={setAddBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={String(book.id)}>{book.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={addBranchId} onValueChange={setAddBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>

              <Button type="submit" disabled={addingStock}>
                {addingStock ? "Adding..." : "Add stock"}
              </Button>
            </form>
          </section>
        )}

        {canTransfer && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Transfer stock</h3>
            </div>
            <form onSubmit={handleTransfer} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Book</Label>
                <Select value={transferBookId} onValueChange={setTransferBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={String(book.id)}>{book.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>From branch</Label>
                  <Select value={fromBranchId} onValueChange={setFromBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>To branch</Label>
                  <Select value={toBranchId} onValueChange={setToBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>

              <Button type="submit" disabled={transferring}>
                {transferring ? "Transferring..." : "Transfer stock"}
              </Button>
            </form>
          </section>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">ISBN</th>
                <th className="px-5 py-3">Available</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-5 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10">
                    <EmptyState icon={Boxes} title="No inventory rows" description="Try changing filters or adding stock." />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className={index % 2 ? "bg-muted/30" : ""}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{row.book.title}</p>
                      <p className="text-xs text-muted-foreground">{row.book.author}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.branch.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.book.isbn}</td>
                    <td className="px-5 py-3 font-medium">{row.availableQuantity}</td>
                    <td className="px-5 py-3">{row.totalQuantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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

export default Inventory;
