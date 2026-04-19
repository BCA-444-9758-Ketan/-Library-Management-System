import { cn } from "@/lib/utils";

type Status = "active" | "issued" | "available" | "overdue" | "reserved" | "returned" | "pending" | "cancelled";

const styles: Record<Status, string> = {
  active: "bg-success/10 text-success border-success/20",
  issued: "bg-success/10 text-success border-success/20",
  available: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  reserved: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  returned: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const StatusBadge = ({ status, children, className }: { status: Status; children?: React.ReactNode; className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", styles[status], className)}>
    {children ?? status}
  </span>
);
