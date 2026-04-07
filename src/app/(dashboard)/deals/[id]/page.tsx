"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/layout/Header";
import { formatCurrency, formatDate, formatRelativeTime, getPriorityColor, cn } from "@/lib/utils";
import {
  Mail, Phone, Calendar, FileText, CheckSquare, ArrowRight,
  DollarSign, Star, User, Building2, Globe, Edit3, Check,
  X, RefreshCw, Plus, Sparkles, Copy, ChevronDown, TrendingUp,
  AlertTriangle, Zap
} from "lucide-react";
import Link from "next/link";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  sentAt?: string;
  viewedAt?: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  expectedCloseDate?: string;
  status: string;
  priority: string;
  probability: number;
  notes?: string;
  lostReason?: string;
  stage: {
    id: string;
    name: string;
    color: string;
    pipeline: { stages: { id: string; name: string; order: number }[] };
  };
  lead?: {
    id: string; name: string; email: string; company?: string;
    website?: string; phone?: string; source: string; score: number;
  };
  owner?: { id: string; name: string; email: string };
  activities: Activity[];
  proposals: Proposal[];
}

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  email:        { icon: <Mail size={12} />,        color: "bg-blue-100 text-blue-600" },
  call:         { icon: <Phone size={12} />,       color: "bg-green-100 text-green-600" },
  meeting:      { icon: <Calendar size={12} />,    color: "bg-purple-100 text-purple-600" },
  note:         { icon: <FileText size={12} />,    color: "bg-yellow-100 text-yellow-600" },
  task:         { icon: <CheckSquare size={12} />, color: "bg-orange-100 text-orange-600" },
  stage_change: { icon: <ArrowRight size={12} />,  color: "bg-slate-100 text-slate-600" },
};

const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  draft:    "bg-slate-100 text-slate-600",
  sent:     "bg-blue-100 text-blue-700",
  viewed:   "bg-purple-100 text-purple-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function AIPanel({ deal }: { deal: Deal }) {
  const [mode, setMode] = useState<"generate" | "analyze">("generate");
  const [genType, setGenType] = useState("cold_email");
  const [analyzeType, setAnalyzeType] = useState("deal_health");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOutput("");
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: genType,
        context: {
          name: deal.lead?.name,
          company: deal.lead?.company,
          website: deal.lead?.website,
          title: deal.lead?.name,
          source: deal.lead?.source,
          stage: deal.stage.name,
          value: formatCurrency(deal.value),
          senderName: deal.owner?.name,
        },
      }),
    });
    const data = await res.json();
    setOutput(data.content || data.error || "Failed to generate");
    setLoading(false);
  };

  const analyze = async () => {
    setLoading(true);
    setOutput("");
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: deal.id, analysisType: analyzeType }),
    });
    const data = await res.json();
    setOutput(data.analysis || data.error || "Failed to analyze");
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <Sparkles size={15} className="text-brand-500" />
        <h3 className="text-sm font-semibold text-slate-900">AI Sales Assistant</h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Mode Toggle */}
        <div className="flex rounded-lg border border-slate-200 p-1 gap-1">
          <button
            onClick={() => setMode("generate")}
            className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-all",
              mode === "generate" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700")}
          >
            Generate Content
          </button>
          <button
            onClick={() => setMode("analyze")}
            className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-all",
              mode === "analyze" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700")}
          >
            Analyze Deal
          </button>
        </div>

        {mode === "generate" ? (
          <>
            <select className="select text-xs" value={genType} onChange={(e) => setGenType(e.target.value)}>
              <option value="cold_email">Cold Email</option>
              <option value="follow_up">Follow-up Email</option>
              <option value="sales_script">Sales Call Script</option>
              <option value="proposal_outline">Proposal Outline</option>
              <option value="outreach_angle">Outreach Strategy</option>
            </select>
            <button onClick={generate} disabled={loading} className="btn-primary w-full text-xs">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {loading ? "Generating..." : "Generate with AI"}
            </button>
          </>
        ) : (
          <>
            <select className="select text-xs" value={analyzeType} onChange={(e) => setAnalyzeType(e.target.value)}>
              <option value="deal_health">Deal Health Check</option>
              <option value="hot_leads">Lead Intent Analysis</option>
              <option value="at_risk">Risk Assessment</option>
            </select>
            <button onClick={analyze} disabled={loading} className="btn-primary w-full text-xs">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
              {loading ? "Analyzing..." : "Analyze with AI"}
            </button>
          </>
        )}

        {output && (
          <div className="mt-2 relative">
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-mono">
              {output}
            </div>
            <button
              onClick={copy}
              className="absolute top-2 right-2 btn-ghost p-1.5 rounded text-slate-400 hover:text-slate-600 bg-white border border-slate-200"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddActivityModal({ dealId, onClose, onSaved }: { dealId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: "note", title: "", description: "", dueDate: "", status: "pending" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dealId }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md animate-slide-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Log Activity</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="note">Note</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Sent intro email..." value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={3} placeholder="Additional details..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="datetime-local" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving || !form.title} className="btn-primary">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            {saving ? "Saving..." : "Log Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState("");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [movingStage, setMovingStage] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/deals/${id}`);
    const data = await res.json();
    setDeal(data);
    setNotesVal(data.notes || "");
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveNotes = async () => {
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesVal }),
    });
    setEditingNotes(false);
    load();
  };

  const moveStage = async (stageId: string) => {
    setMovingStage(true);
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    setMovingStage(false);
    load();
  };

  const markWon = async () => {
    if (!confirm("Mark this deal as Won?")) return;
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "won" }),
    });
    load();
  };

  const markLost = async () => {
    const reason = prompt("Reason for losing this deal:");
    if (reason === null) return;
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "lost", lostReason: reason }),
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-slate-400">
          <AlertTriangle size={32} className="mx-auto mb-2" />
          <p className="text-sm">Deal not found</p>
          <Link href="/pipeline" className="text-brand-600 text-sm hover:underline mt-2 block">Back to Pipeline</Link>
        </div>
      </div>
    );
  }

  const stages = deal.stage.pipeline.stages.sort((a, b) => a.order - b.order);

  return (
    <div>
      <Header
        title={deal.title}
        subtitle={`${deal.stage.name} · ${formatCurrency(deal.value)}`}
      />

      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-5">
          {/* Deal Status Banner */}
          {deal.status !== "open" && (
            <div className={cn("flex items-center gap-3 p-4 rounded-xl border text-sm font-medium",
              deal.status === "won"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}>
              {deal.status === "won" ? <Check size={16} /> : <X size={16} />}
              {deal.status === "won" ? "This deal is Closed Won!" : `This deal is Closed Lost${deal.lostReason ? ` — ${deal.lostReason}` : ""}`}
            </div>
          )}

          {/* Stage Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Pipeline Stage</h3>
              {deal.status === "open" && (
                <div className="flex gap-2">
                  <button onClick={markWon} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">
                    <Check size={12} /> Mark Won
                  </button>
                  <button onClick={markLost} className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200">
                    <X size={12} /> Mark Lost
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {stages.filter((s) => !["Closed Won", "Closed Lost"].includes(s.name)).map((s) => (
                <button
                  key={s.id}
                  onClick={() => deal.status === "open" && moveStage(s.id)}
                  disabled={movingStage || deal.status !== "open"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    s.id === deal.stage.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed"
                  )}
                >
                  {movingStage && s.id === deal.stage.id && <RefreshCw size={10} className="animate-spin" />}
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
              {!editingNotes ? (
                <button onClick={() => setEditingNotes(true)} className="btn-ghost btn-sm">
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingNotes(false)} className="btn-ghost btn-sm"><X size={12} /> Cancel</button>
                  <button onClick={saveNotes} className="btn-primary btn-sm"><Check size={12} /> Save</button>
                </div>
              )}
            </div>
            <div className="p-5">
              {editingNotes ? (
                <textarea
                  className="textarea w-full"
                  rows={5}
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="Add notes about this deal..."
                />
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {deal.notes || <span className="text-slate-400 italic">No notes yet. Click Edit to add notes.</span>}
                </p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Activity Timeline</h3>
              <button onClick={() => setShowAddActivity(true)} className="btn-secondary btn-sm">
                <Plus size={12} /> Log Activity
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {deal.activities.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No activities yet.</div>
              ) : (
                deal.activities.map((act) => {
                  const info = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.note;
                  return (
                    <div key={act.id} className="flex gap-4 px-5 py-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${info.color}`}>
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{act.title}</p>
                          <span className={cn("badge text-[10px] shrink-0",
                            act.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            act.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-600"
                          )}>{act.status}</span>
                        </div>
                        {act.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{act.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-slate-400">{act.user.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{formatRelativeTime(act.createdAt)}</span>
                          {act.dueDate && (
                            <>
                              <span className="text-slate-200">·</span>
                              <span className="text-xs text-slate-400">Due: {formatDate(act.dueDate)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Proposals */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Proposals</h3>
              <Link href={`/proposals?dealId=${deal.id}`} className="btn-secondary btn-sm">
                <FileText size={12} /> Create Proposal
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {deal.proposals.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No proposals yet.</div>
              ) : (
                deal.proposals.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <FileText size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(p.totalValue)} · Created {formatDate(p.createdAt)}
                        {p.sentAt && ` · Sent ${formatDate(p.sentAt)}`}
                        {p.viewedAt && ` · Viewed ${formatDate(p.viewedAt)}`}
                      </p>
                    </div>
                    <span className={`badge capitalize ${PROPOSAL_STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Deal Info */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Deal Details</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Value</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(deal.value)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Stage</span>
                <span className="text-xs font-medium text-slate-700 px-2 py-1 rounded-lg" style={{ backgroundColor: deal.stage.color + "20", color: deal.stage.color }}>
                  {deal.stage.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Priority</span>
                <span className={`badge capitalize ${getPriorityColor(deal.priority)}`}>{deal.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Probability</span>
                <span className={`text-sm font-semibold ${deal.probability >= 70 ? "text-emerald-600" : deal.probability >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                  {deal.probability}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Expected Close</span>
                <span className="text-xs text-slate-700">{formatDate(deal.expectedCloseDate)}</span>
              </div>
              {deal.owner && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Owner</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-brand-600">
                        {deal.owner.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-700">{deal.owner.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Info */}
          {deal.lead && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Lead</h3>
                <Link href={`/leads`} className="text-xs text-brand-600 hover:underline">View all</Link>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {deal.lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{deal.lead.name}</p>
                  {deal.lead.company && <p className="text-xs text-slate-500">{deal.lead.company}</p>}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <a href={`mailto:${deal.lead.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-600">
                  <Mail size={12} className="text-slate-400" /> {deal.lead.email}
                </a>
                {deal.lead.phone && (
                  <a href={`tel:${deal.lead.phone}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-600">
                    <Phone size={12} className="text-slate-400" /> {deal.lead.phone}
                  </a>
                )}
                {deal.lead.website && (
                  <a href={deal.lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-600">
                    <Globe size={12} className="text-slate-400" /> {deal.lead.website.replace(/^https?:\/\//, "").split("/")[0]}
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-600">Lead Score: <strong>{deal.lead.score}/100</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* AI Assistant */}
          <AIPanel deal={deal} />
        </div>
      </div>

      {showAddActivity && (
        <AddActivityModal
          dealId={deal.id}
          onClose={() => setShowAddActivity(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
