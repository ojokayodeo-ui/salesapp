"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Kanban,
  BarChart3,
  Zap,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { name: "Pipeline",     href: "/pipeline",     icon: Kanban },
  { name: "Leads",        href: "/leads",        icon: Users },
  { name: "Analytics",    href: "/analytics",    icon: BarChart3 },
  { name: "Proposals",    href: "/proposals",    icon: FileText },
  { name: "Automations",  href: "/automations",  icon: Zap },
  { name: "Settings",     href: "/settings",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
          <TrendingUp className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-none">Revenue OS</p>
          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{user?.organization?.name || "Sales System"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", isActive && "active")}
            >
              <item.icon size={16} className="shrink-0" />
              {item.name}
              {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 group cursor-default">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate leading-none">{user?.name}</p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user?.role?.replace("_", " ")}</p>
          </div>
          <button
            onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-red-500"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
