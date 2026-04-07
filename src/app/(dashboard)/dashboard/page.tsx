"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { formatCurrency, formatRelativeTime, getActivityIcon } from "@/lib/utils";
import {
  TrendingUp, DollarSign, Target, Users, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertTriangle, Mail, Phone, Calendar, FileText,
  CheckSquare, Activity
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalPipelineValue: number;
    weightedPipeline: number;
    wonValue: number;
    conversionRate: number;
    avgDealSize: number;
  };
  funnelData: { name: string; count: number; value: number; color: string }[];
  revenueByMonth: { month: string; value: number }[];
  repPerformance: { userId: string; name: string; dealsWon: number; dealsLost: number; dealsOpen: number; wonValue: number; activities: number }[];
  recentActivities: {
    id: string; type: string; title: string; createdAt: string;
    user: { name: string }; deal?: { id: string; title: string }; lead?: { name: string; company: string };
  }[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  email:        <Mail size={12} />,
  call:         <Phone size={12} />,
  meeting:      <Calendar size={12} />,
  note:         <FileText size={12} />,
  task:         <CheckSquare size={12} />,
  stage_change: <ArrowUpRight size={12} />,
};

function StatCard({
  title, value, sub, icon: Icon, trend, trendLabel, color = "blue"
}: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  trend?: number; trendLabel?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:   "bg-brand-50 text-brand-600",
    green:  "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}% {trendLabel}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?period=30")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Activity size={32} className="animate-pulse" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const ov = data?.overview;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={`Sales overview · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        action={{ label: "Add Deal", onClick: () => {} }}
      />

      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pipeline Value"
            value={formatCurrency(ov?.totalPipelineValue ?? 0)}
            sub={`${ov?.openDeals ?? 0} open deals`}
            icon={DollarSign}
            color="blue"
            trend={12}
            trendLabel="vs last month"
          />
          <StatCard
            title="Weighted Pipeline"
            value={formatCurrency(ov?.weightedPipeline ?? 0)}
            sub="Probability-adjusted"
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Revenue Closed"
            value={formatCurrency(ov?.wonValue ?? 0)}
            sub={`${ov?.wonDeals ?? 0} deals won`}
            icon={TrendingUp}
            color="green"
            trend={8}
            trendLabel="vs last month"
          />
          <StatCard
            title="Conversion Rate"
            value={`${ov?.conversionRate ?? 0}%`}
            sub={`Avg deal: ${formatCurrency(ov?.avgDealSize ?? 0)}`}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="card col-span-2">
            <div className="card-header flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Revenue Closed</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monthly closed revenue</p>
              </div>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data?.revenueByMonth ?? []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-slate-900">Pipeline Funnel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Deals by stage</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.funnelData?.slice(0, 7) ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [v, "Deals"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data?.funnelData?.slice(0, 7).map((entry, i) => (
                      <Cell key={i} fill={entry.color || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Rep Performance */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Rep Performance</h3>
              <Link href="/analytics" className="text-xs text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.repPerformance ?? []).map((rep) => (
                <div key={rep.userId} className="px-6 py-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand-600">
                      {rep.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{rep.name}</p>
                    <p className="text-xs text-slate-500">{rep.dealsOpen} open · {rep.dealsWon} won</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(rep.wonValue)}</p>
                    <p className="text-xs text-slate-500">{rep.activities} activities</p>
                  </div>
                </div>
              ))}
              {(data?.repPerformance ?? []).length === 0 && (
                <div className="px-6 py-6 text-center text-sm text-slate-400">No rep data yet</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <Link href="/leads" className="text-xs text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.recentActivities ?? []).slice(0, 6).map((act) => (
                <div key={act.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    {ACTIVITY_ICONS[act.type] || <Activity size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{act.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500">{act.user?.name}</span>
                      {act.deal && (
                        <>
                          <span className="text-slate-300">·</span>
                          <Link href={`/deals/${act.deal.id}`} className="text-xs text-brand-600 hover:underline truncate">
                            {act.deal.title}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatRelativeTime(act.createdAt)}</span>
                </div>
              ))}
              {(data?.recentActivities ?? []).length === 0 && (
                <div className="px-6 py-6 text-center text-sm text-slate-400">No activity yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{ov?.wonDeals ?? 0}</p>
              <p className="text-xs text-slate-500">Deals Won</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{ov?.openDeals ?? 0}</p>
              <p className="text-xs text-slate-500">Open Deals</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{ov?.lostDeals ?? 0}</p>
              <p className="text-xs text-slate-500">Deals Lost</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
