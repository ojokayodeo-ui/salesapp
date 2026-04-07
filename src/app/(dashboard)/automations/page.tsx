"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { formatRelativeTime } from "@/lib/utils";
import { Zap, Plus, X, RefreshCw, ToggleLeft, ToggleRight, Trash2, PlayCircle, Clock, Bell, GitBranch, TrendingUp } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  triggerConfig: string;
  actions: string;
  isActive: boolean;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  stage_enter:  { label: "Stage Enter",        icon: <GitBranch size={14} />, color: "bg-blue-100 text-blue-700" },
  stage_exit:   { label: "Stage Exit",         icon: <GitBranch size={14} />, color: "bg-slate-100 text-slate-700" },
  time_delay:   { label: "Time Delay",         icon: <Clock size={14} />,      color: "bg-amber-100 text-amber-700" },
  no_reply:     { label: "No Reply",           icon: <Bell size={14} />,       color: "bg-red-100 text-red-700" },
  deal_created: { label: "Deal Created",       icon: <Plus size={14} />,       color: "bg-green-100 text-green-700" },
  deal_won:     { label: "Deal Won",           icon: <TrendingUp size={14} />, color: "bg-emerald-100 text-emerald-700" },
  deal_lost:    { label: "Deal Lost",          icon: <X size={14} />,          color: "bg-red-100 text-red-700" },
};

const ACTION_LABELS: Record<string, string> = {
  send_email:    "Send Email",
  create_task:   "Create Task",
  notify_rep:    "Notify Rep",
  notify_team:   "Notify Team",
  move_stage:    "Move Stage",
  update_field:  "Update Field",
};

function AddAutomationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger: "stage_enter",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        triggerConfig: {},
        actions: [{ type: "create_task", config: { title: "Follow up", dueInDays: 1 } }],
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-lg animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Create Automation</h2>
            <p className="text-xs text-slate-500 mt-0.5">Set up automated workflows for your pipeline</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Automation Name *</label>
            <input className="input" placeholder="e.g. Follow-up after 3 days of no reply"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={2} placeholder="What does this automation do?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Trigger</label>
            <select className="select" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">
              {form.trigger === "time_delay" && "Triggers after a set number of days with no activity."}
              {form.trigger === "stage_enter" && "Triggers when a deal enters a specific pipeline stage."}
              {form.trigger === "deal_won" && "Triggers immediately when a deal is marked as Closed Won."}
              {form.trigger === "no_reply" && "Triggers when a lead hasn't replied within a set timeframe."}
              {form.trigger === "deal_created" && "Triggers when a new deal is created in the pipeline."}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </label>
            <span className="text-sm text-slate-700">Active immediately after creation</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving || !form.name} className="btn-primary">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {saving ? "Creating..." : "Create Automation"}
          </button>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_SEQUENCES = [
  {
    name: "7-Day Cold Outreach Sequence",
    steps: [
      { day: 0,  type: "email",  label: "Initial cold email — personalized opener" },
      { day: 3,  type: "task",   label: "Check if email was opened; prep follow-up" },
      { day: 5,  type: "email",  label: "Follow-up #1 — add new value/insight" },
      { day: 9,  type: "call",   label: "Phone call attempt" },
      { day: 12, type: "email",  label: "Follow-up #2 — breakup email" },
    ],
  },
  {
    name: "Post-Meeting Follow-up",
    steps: [
      { day: 0, type: "email", label: "Same-day thank you + recap email" },
      { day: 2, type: "email", label: "Send proposal or next steps" },
      { day: 5, type: "task",  label: "Follow up on proposal status" },
      { day: 8, type: "email", label: "Final nudge email" },
    ],
  },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/automations");
    const data = await res.json();
    setAutomations(data.automations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (auto: Automation) => {
    await fetch(`/api/automations/${auto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !auto.isActive }),
    });
    load();
  };

  const deleteAuto = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    load();
  };

  const parseActions = (actStr: string): { type: string; config: Record<string, unknown> }[] => {
    try { return JSON.parse(actStr); } catch { return []; }
  };

  return (
    <div>
      <Header
        title="Automations"
        subtitle={`${automations.filter((a) => a.isActive).length} active automations`}
        action={{ label: "New Automation", onClick: () => setShowAdd(true), icon: <Zap size={14} /> }}
      />

      <div className="p-6 space-y-6">
        {/* Automation List */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Automations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated workflows running on your pipeline</p>
            </div>
            <button onClick={load} className="btn-ghost p-2 rounded-lg">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-slate-300" />
            </div>
          ) : automations.length === 0 ? (
            <div className="py-16 text-center">
              <Zap size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No automations yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {automations.map((auto) => {
                const triggerInfo = TRIGGER_LABELS[auto.trigger] || { label: auto.trigger, icon: <Zap size={14} />, color: "bg-slate-100 text-slate-600" };
                const actions = parseActions(auto.actions);
                return (
                  <div key={auto.id} className="px-6 py-4 flex items-start gap-4">
                    {/* Status dot */}
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${auto.isActive ? "bg-emerald-400" : "bg-slate-300"}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{auto.name}</p>
                        <span className={`badge text-[10px] ${triggerInfo.color}`}>
                          {triggerInfo.icon}
                          {triggerInfo.label}
                        </span>
                      </div>
                      {auto.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{auto.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {actions.map((a, i) => (
                          <span key={i} className="badge bg-slate-100 text-slate-600 text-[10px]">
                            <PlayCircle size={9} />
                            {ACTION_LABELS[a.type] || a.type}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-400">{auto.executionCount} executions</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-[11px] text-slate-400">Updated {formatRelativeTime(auto.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggle(auto)} className="btn-ghost p-1.5 rounded-lg text-slate-400" title={auto.isActive ? "Disable" : "Enable"}>
                        {auto.isActive ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => deleteAuto(auto.id)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pre-built Sequences */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Pre-built Follow-up Sequences</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SAMPLE_SEQUENCES.map((seq) => (
              <div key={seq.name} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">{seq.name}</h3>
                  <span className="badge bg-brand-50 text-brand-700 text-[10px]">{seq.steps.length} steps</span>
                </div>
                <div className="space-y-2.5">
                  {seq.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          step.type === "email" ? "bg-blue-100 text-blue-700" :
                          step.type === "call"  ? "bg-green-100 text-green-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          D{step.day}
                        </div>
                        {i < seq.steps.length - 1 && <div className="w-px h-4 bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-slate-700">{step.label}</p>
                        <span className={`text-[10px] font-medium ${
                          step.type === "email" ? "text-blue-600" :
                          step.type === "call"  ? "text-green-600" :
                          "text-amber-600"
                        }`}>{step.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="btn-secondary w-full mt-4 text-xs"
                >
                  <Plus size={12} /> Use This Sequence
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && <AddAutomationModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
