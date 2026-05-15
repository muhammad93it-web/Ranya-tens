import { useLocation, Link } from "wouter";
import {
  LayoutGrid,
  Clock,
  Table2,
  BarChart3,
  Receipt,
  Users,
  Settings,
  LogOut,
  Trophy,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "میزەکان", icon: <LayoutGrid size={18} /> },
  { path: "/times", label: "کاتیەکان", icon: <Clock size={18} /> },
  { path: "/courts", label: "بەڕێوەبردنی میزەکان", icon: <Table2 size={18} />, adminOnly: true },
  { path: "/reports", label: "ڕاپۆرتەکان", icon: <BarChart3 size={18} /> },
  { path: "/expenses", label: "خەرجییەکان", icon: <Receipt size={18} /> },
  { path: "/users", label: "بەکارهێنەران", icon: <Users size={18} />, adminOnly: true },
  { path: "/settings", label: "ڕێکخستنەکان", icon: <Settings size={18} />, adminOnly: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useUser();

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — first in DOM = appears on the RIGHT in RTL flex */}
      <aside className="w-56 border-s border-sidebar-border bg-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 border-b border-sidebar-border flex items-center justify-center gap-2 px-4">
          <Trophy className="text-primary" size={22} />
          <span className="font-bold text-sidebar-foreground text-base">Tennis Ranya</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = location === item.path || (item.path === "/dashboard" && location === "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-testid={`nav-${item.path.replace("/", "")}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-3">
            <p className="text-sidebar-foreground text-sm font-medium">{user?.username}</p>
            <p className="text-muted-foreground text-xs">
              {user?.role === "admin" ? "ئەدمین" : "کاشێر"}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="button-logout"
          >
            <LogOut size={16} />
            <span>دەرچوون</span>
          </button>
        </div>
      </aside>

      {/* Main content — second in DOM = appears on the LEFT in RTL flex */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("ku", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="text-primary" size={20} />
            <span className="font-bold text-foreground text-lg">Tennis Ranya</span>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
