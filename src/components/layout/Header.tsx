"use client";

import { useState } from "react";
import { Search, Bell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/leads?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center gap-4">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads, deals..."
          className="input pl-9 pr-4 w-56 text-sm"
        />
      </form>

      {/* Notifications (UI only) */}
      <button className="relative btn-ghost p-2 rounded-lg">
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      {/* Primary action */}
      {action && (
        <button onClick={action.onClick} className="btn-primary btn-sm gap-1.5">
          {action.icon || <Plus size={14} />}
          {action.label}
        </button>
      )}
    </header>
  );
}
