import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, BookMarked, CalendarClock, Building2,
  Sparkles, Users, ScrollText, LogOut, Menu, Search, Bell, X,
} from "lucide-react";
import { useAuth, Role } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/books", label: "Books", icon: BookOpen },
  { to: "/loans", label: "My Loans", icon: BookMarked },
  { to: "/reservations", label: "Reservations", icon: CalendarClock },
  { to: "/branches", label: "Branches", icon: Building2 },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
];

const Logo = () => (
  <div className="flex items-center gap-2 px-4 py-5">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero text-white shadow-card">
      <BookOpen className="h-5 w-5" />
    </div>
    <span className="text-lg font-bold text-primary">SmartLib</span>
  </div>
);

const SidebarNav = ({ role, onNavigate }: { role: Role; onNavigate?: () => void }) => {
  const items = navItems.filter((i) => !i.roles || i.roles.includes(role));
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

const MobileBottomNav = ({ role }: { role: Role }) => {
  const items = navItems.filter((i) => !i.roles || i.roles.includes(role)).slice(0, 5);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/books": "Books Catalogue",
    "/loans": "My Loans",
    "/reservations": "Reservations",
    "/branches": "Branches",
    "/recommendations": "Picked For You",
    "/admin/users": "Users Management",
    "/admin/audit": "Audit Log",
  };
  const pageTitle = titleMap[location.pathname] ?? "SmartLib";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <Logo />
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav role={user.role} />
        </div>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-2 text-xs">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate capitalize text-muted-foreground">{user.role}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-elegant">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" className="mr-2" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-3">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Gradient top bar */}
        <header className="gradient-header sticky top-0 z-30 text-white shadow-card">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold sm:text-lg">{pageTitle}</h1>
              <p className="hidden truncate text-xs text-white/80 sm:block">CIMAGE College Patna · Library Portal</p>
            </div>
            <div className="hidden md:block md:w-72">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  placeholder="Search books, authors…"
                  className="h-9 border-white/20 bg-white/10 pl-9 text-sm text-white placeholder:text-white/70 focus-visible:ring-white/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/books?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  }}
                />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">{children}</div>
        </main>

        <MobileBottomNav role={user.role} />
      </div>
    </div>
  );
};
