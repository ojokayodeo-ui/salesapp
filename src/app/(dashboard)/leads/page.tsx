"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { formatDate, formatRelativeTime, parseTags, getSourceColor, cn } from "@/lib/utils";
import Papa from "papaparse";
import {
  Plus, Upload, Search, Filter, ExternalLink, Trash2, Edit3,
  Mail, Globe, Building2, Tag, ChevronDown, X, Star, RefreshCw,
  UserPlus, Phone
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  phone?: string;
  title?: string;
  source: string;
  status: string;
  tags: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  _count?: { deals: number; activities: number };
}

const SOURCES = ["cold", "inbound", "referral", "form", "csv", "manual"];
const STATUSES = ["new", "contacted", "qualified", "disqualified"];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700" :
                score >= 60 ? "bg-yellow-100 text-yellow-700" :
                score >= 40 ? "bg-orange-100 text-orange-700" :
                              "bg-slate-100 text-slate-600";
  return (
    <span className={`score-badge ${color}`}>
      <Star size={9} />
      {score}
    </span>
  );
}

function AddLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", company: "", website: "", phone: "", title: "",
    source: "manual", tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
      onClose();
    } catch {
      setError("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add New Lead</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter lead information manually</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="jane@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <input className="input" placeholder="Acme Inc." value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input className="input" placeholder="Head of Growth" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Website</label>
              <input className="input" placeholder="https://company.com" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+1 555 123 4567" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source</label>
              <select className="select" value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="SaaS, ICP, B2B" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {saving ? "Saving..." : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => setRows(r.data as Record<string, string>[]),
    });
  };

  const doImport = async () => {
    setImporting(true);
    const payload = rows.map((r) => ({
      name: r.name || r.Name || r.full_name || "",
      email: r.email || r.Email || "",
      company: r.company || r.Company || "",
      website: r.website || r.Website || "",
      phone: r.phone || r.Phone || "",
      source: "csv",
      tags: [],
    }));

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const ok = data.results?.filter((r: { success: boolean }) => r.success).length ?? 0;
    const fail = (data.results?.length ?? 0) - ok;
    setResult({ ok, fail });
    setImporting(false);
    onImported();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Import Leads from CSV</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
          >
            <Upload size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
            <p className="text-xs text-slate-400 mt-1">Columns: name, email, company, website, phone</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
          </div>

          {rows.length > 0 && !result && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700">{rows.length} leads found in CSV</p>
              <p className="text-xs text-slate-500 mt-1">Preview: {rows.slice(0, 3).map((r) => r.name || r.Name || r.email).join(", ")}{rows.length > 3 ? "..." : ""}</p>
            </div>
          )}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-800">{result.ok} leads imported successfully</p>
              {result.fail > 0 && <p className="text-xs text-red-600 mt-1">{result.fail} failed (missing name or email)</p>}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">{result ? "Close" : "Cancel"}</button>
          {!result && (
            <button onClick={doImport} disabled={rows.length === 0 || importing} className="btn-primary">
              {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? "Importing..." : `Import ${rows.length} Leads`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterSource) params.set("source", filterSource);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, filterSource, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div>
      <Header
        title="Leads"
        subtitle={`${total} total leads`}
        action={{ label: "Add Lead", onClick: () => setShowAdd(true), icon: <UserPlus size={14} /> }}
      />

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select text-sm w-36" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        <select className="select text-sm w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        <div className="flex-1" />

        <button onClick={() => setShowImport(true)} className="btn-secondary btn-sm">
          <Upload size={13} /> Import CSV
        </button>

        <button onClick={load} className="btn-ghost p-2 rounded-lg text-slate-500">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" onChange={(e) => {
                  if (e.target.checked) setSelected(new Set(leads.map((l) => l.id)));
                  else setSelected(new Set());
                }} />
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Lead</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Company</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Source</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tags</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Deals</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Added</th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-400 text-sm">
                  No leads found. Add your first lead or import from CSV.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const tags = parseTags(lead.tags);
                return (
                  <tr key={lead.id} className={cn("table-row", selected.has(lead.id) && "bg-brand-50/30")}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-white">
                            {lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                          <a href={`mailto:${lead.email}`} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1">
                            <Mail size={10} />{lead.email}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700">{lead.company || "—"}</span>
                      </div>
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 mt-0.5">
                          <Globe size={10} />{lead.website.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${getSourceColor(lead.source)}`}>{lead.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge capitalize",
                        lead.status === "qualified" ? "bg-emerald-100 text-emerald-700" :
                        lead.status === "disqualified" ? "bg-red-100 text-red-700" :
                        lead.status === "contacted" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        {tags.length > 2 && (
                          <span className="tag">+{tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{lead._count?.deals ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => deleteLead(lead.id)}
                          className="btn-ghost p-1.5 rounded text-slate-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={load} />}
    </div>
  );
}
