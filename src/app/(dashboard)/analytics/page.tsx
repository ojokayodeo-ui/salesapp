"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign, RefreshCw } from "lucide-react";

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
  repPerformance: {
    userId: string; name: string;
    dealsWon: number; dealsLost: number; dealsOpen: number;
    wonValue: number; activities: number;
  }[];
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  const ov = data?.overview;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const winRate = ov ? (ov.wonDeals / (ov.wonDeals + ov.lostDeals || 1)) * 100 : 0;
  const pieData = [
    { name: "Won", value: ov?.wonDeals ?? 0, color: "#10b981" },
    { name: "Lost", value: ov?.lostDeals ?? 0, color: "#ef4444" },
    { name: "Open", value: ov?.openDeals ?? 0, color: "#2563eb" },
  ];

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Pipeline performance and revenue insights"
      />

      <div className="p-6 space-y-6">
        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Period:</span>
          {["7", "30", "90", "365"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                period === p ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p === "7" ? "7D" : p === "30" ? "30D" : p === "90" ? "3M" : "1Y"}
            </button>
          ))}
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pipeline",    value: formatCurrency(ov?.totalPipelineValue ?? 0), sub: `${ov?.openDeals} open deals`,    icon: DollarSign, color: "blue" },
            { label: "Revenue Won",       value: formatCurrency(ov?.wonValue ?? 0),            sub: `${ov?.wonDeals} deals closed`,   icon: TrendingUp, color: "green" },
            { label: "Win Rate",          value: `${winRate.toFixed(1)}%`,                     sub: `${ov?.lostDeals} deals lost`,    icon: Activity,   color: "purple" },
            { label: "Avg Deal Size",     value: formatCurrency(ov?.avgDealSize ?? 0),          sub: `Conversion: ${ov?.conversionRate}%`, icon: TrendingDown, color: "orange" },
          ].map((kpi) => (
            <div key={kpi.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${
                  kpi.color === "blue" ? "bg-brand-50 text-brand-600" :
                  kpi.color === "green" ? "bg-emerald-50 text-emerald-600" :
                  kpi.color === "purple" ? "bg-purple-50 text-purple-600" :
                  "bg-orange-50 text-orange-600"
                }`}>
                  <kpi.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue + Outcome Charts */}
        <div className="grid grid-cols-3 gap-4">
          {/* Revenue by Month */}
          <div className="card col-span-2">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-slate-900">Monthly Revenue Closed</h3>
              <p className="text-xs text-slate-500 mt-0.5">Closed-won deal value per month</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.revenueByMonth ?? []}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deal Outcomes */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-slate-900">Deal Outcomes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Won vs. Lost vs. Open</p>
            </div>
            <div className="p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-slate-900">Pipeline Funnel Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Deals and value at each stage</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {(data?.funnelData ?? []).map((stage, i) => {
                const maxCount = Math.max(...(data?.funnelData ?? []).map((s) => s.count), 1);
                const pct = (stage.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-28 text-xs text-slate-600 text-right truncate shrink-0">{stage.name}</div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color || "#6366f1" }}
                        >
                          {stage.count > 0 && (
                            <span className="text-[10px] text-white font-semibold whitespace-nowrap">
                              {stage.count} deal{stage.count !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 w-20 text-right">
                        {formatCurrency(stage.value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rep Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-slate-900">Rep Performance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Individual sales team results</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.repPerformance ?? []} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Bar dataKey="dealsWon" name="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dealsLost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dealsOpen" name="Open" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rep Table */}
          <div className="border-t border-slate-100">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Rep", "Open", "Won", "Lost", "Revenue", "Activities"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.repPerformance ?? []).map((rep) => (
                  <tr key={rep.userId} className="table-row">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-brand-600">
                            {rep.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{rep.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{rep.dealsOpen}</td>
                    <td className="px-5 py-3 text-sm text-emerald-600 font-medium">{rep.dealsWon}</td>
                    <td className="px-5 py-3 text-sm text-red-500">{rep.dealsLost}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{formatCurrency(rep.wonValue)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{rep.activities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
