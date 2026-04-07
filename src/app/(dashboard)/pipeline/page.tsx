"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { formatCurrency, formatDate, getPriorityColor, cn } from "@/lib/utils";
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  Plus, Star, Calendar, DollarSign, User, RefreshCw, X,
  Grip, TrendingUp, AlertCircle
} from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value: number;
  priority: string;
  probability: number;
  expectedCloseDate?: string;
  lead?: { id: string; name: string; company?: string; score: number };
  owner?: { id: string; name: string };
  _count?: { activities: number };
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  deals: Deal[];
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("kanban-card group", isDragging && "dnd-drag-overlay")}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/deals/${deal.id}`} className="text-sm font-medium text-slate-900 hover:text-brand-600 line-clamp-2 flex-1">
          {deal.title}
        </Link>
        <button {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0">
          <Grip size={13} />
        </button>
      </div>

      {deal.lead && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-brand-600">
              {deal.lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <span className="text-xs text-slate-600 truncate">{deal.lead.company || deal.lead.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-slate-900">{formatCurrency(deal.value)}</span>
        <span className={`badge text-[10px] ${getPriorityColor(deal.priority)}`}>{deal.priority}</span>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Star size={9} />
          <span className={deal.probability >= 70 ? "text-emerald-600 font-medium" : ""}>{deal.probability}%</span>
        </div>
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar size={9} />
            {formatDate(deal.expectedCloseDate)}
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumn({ stage, onAddDeal }: { stage: Stage; onAddDeal: (stageId: string) => void }) {
  const stageValue = stage.deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
        <h3 className="text-sm font-semibold text-slate-700 flex-1 truncate">{stage.name}</h3>
        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 font-medium">{stage.deals.length}</span>
      </div>

      {/* Stage Value */}
      <div className="text-xs text-slate-400 mb-3 px-1 font-medium">{formatCurrency(stageValue)}</div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1 min-h-[100px] pb-2">
        <SortableContext items={stage.deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {stage.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {stage.deals.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
            Drop deals here
          </div>
        )}
      </div>

      {/* Add Deal */}
      <button
        onClick={() => onAddDeal(stage.id)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors mt-1"
      >
        <Plus size={13} />
        Add deal
      </button>
    </div>
  );
}

function AddDealModal({
  stageId, stages, onClose, onSaved
}: {
  stageId: string; stages: Stage[]; onClose: () => void; onSaved: () => void;
}) {
  const [leads, setLeads] = useState<{ id: string; name: string; company?: string }[]>([]);
  const [form, setForm] = useState({
    title: "", value: "", stageId, leadId: "", priority: "medium",
    probability: "20", expectedCloseDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/leads?limit=100").then((r) => r.json()).then((d) => setLeads(d.leads ?? []));
  }, []);

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        value: parseFloat(form.value) || 0,
        probability: parseInt(form.probability) || 20,
        leadId: form.leadId || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add New Deal</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Deal Title *</label>
            <input className="input" placeholder="e.g. Acme Corp — Pro Plan" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Deal Value ($)</label>
              <input className="input" type="number" placeholder="5000" value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="select" value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Linked Lead</label>
            <select className="select" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}>
              <option value="">No lead linked</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Probability %</label>
              <input className="input" type="number" min="0" max="100" value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })} />
            </div>
            <div>
              <label className="label">Close Date</label>
              <input className="input" type="date" value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={2} placeholder="Initial context..." value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving || !form.title} className="btn-primary">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Saving..." : "Create Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [addDealStageId, setAddDealStageId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pipeline");
    const data = await res.json();
    setPipeline(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const findDeal = useCallback((id: string): Deal | null => {
    for (const stage of pipeline?.stages ?? []) {
      const deal = stage.deals.find((d) => d.id === id);
      if (deal) return deal;
    }
    return null;
  }, [pipeline]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDeal(findDeal(String(event.active.id)));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !pipeline) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find which stage the over target belongs to
    const overStage = pipeline.stages.find((s) =>
      s.id === overId || s.deals.some((d) => d.id === overId)
    );
    const activeStage = pipeline.stages.find((s) => s.deals.some((d) => d.id === activeId));

    if (!overStage || !activeStage || overStage.id === activeStage.id) return;

    setPipeline((prev) => {
      if (!prev) return prev;
      const deal = activeStage.deals.find((d) => d.id === activeId);
      if (!deal) return prev;

      return {
        ...prev,
        stages: prev.stages.map((s) => {
          if (s.id === activeStage.id) return { ...s, deals: s.deals.filter((d) => d.id !== activeId) };
          if (s.id === overStage.id) return { ...s, deals: [...s.deals, deal] };
          return s;
        }),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over || !pipeline) return;

    const activeId = String(active.id);
    const newStage = pipeline.stages.find((s) => s.deals.some((d) => d.id === activeId));
    if (!newStage) return;

    // Persist stage change
    await fetch(`/api/deals/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStage.id }),
    });
  };

  const totalValue = pipeline?.stages.reduce((s, stage) => s + stage.deals.reduce((ss, d) => ss + d.value, 0), 0) ?? 0;
  const totalDeals = pipeline?.stages.reduce((s, stage) => s + stage.deals.length, 0) ?? 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pipeline"
        subtitle={`${totalDeals} open deals · ${formatCurrency(totalValue)} total`}
        action={{ label: "Add Deal", onClick: () => setAddDealStageId(pipeline?.stages[0]?.id ?? "") }}
      />

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 p-6 min-w-max">
              {pipeline?.stages.map((stage) => (
                <StageColumn key={stage.id} stage={stage} onAddDeal={setAddDealStageId} />
              ))}
            </div>

            <DragOverlay>
              {activeDeal && <DealCard deal={activeDeal} isDragging />}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {addDealStageId && pipeline && (
        <AddDealModal
          stageId={addDealStageId}
          stages={pipeline.stages}
          onClose={() => setAddDealStageId(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
