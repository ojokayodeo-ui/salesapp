"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { FileText, Plus, X, RefreshCw, Send, Eye, Check, XCircle, Trash2, Edit3 } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  content: string;
  status: string;
  totalValue: number;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  validUntil?: string;
  dealId: string;
  deal?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
  draft:    { cls: "bg-slate-100 text-slate-600",   icon: <Edit3 size={10} /> },
  sent:     { cls: "bg-blue-100 text-blue-700",     icon: <Send size={10} /> },
  viewed:   { cls: "bg-purple-100 text-purple-700", icon: <Eye size={10} /> },
  accepted: { cls: "bg-emerald-100 text-emerald-700", icon: <Check size={10} /> },
  rejected: { cls: "bg-red-100 text-red-700",       icon: <XCircle size={10} /> },
};

const PROPOSAL_TEMPLATE = `# Proposal: [Client Name]

## Executive Summary

We are pleased to present this proposal for [Client Company]. Based on our conversations, we understand your key challenges are [pain points], and we believe our solution is uniquely positioned to help you achieve [desired outcome].

---

## The Problem

[Describe the client's specific challenges and pain points in detail. Reference specifics from your discovery calls.]

---

## Our Solution

[Describe your proposed solution in clear, outcome-focused language. Avoid jargon.]

**Key Deliverables:**
- Deliverable 1
- Deliverable 2
- Deliverable 3

---

## Investment

| Item              | Price      |
|-------------------|------------|
| Setup / Onboarding| $X,XXX     |
| Monthly License   | $X,XXX/mo  |
| **Total (Year 1)**| **$XX,XXX**|

---

## Expected ROI

Based on industry benchmarks, clients similar to [Company] typically see:
- X% reduction in [metric]
- X hours saved per week
- ROI within X months

---

## Timeline

- Week 1: Kickoff & onboarding
- Week 2-3: Implementation
- Week 4: Go-live & training

---

## Next Steps

To move forward, simply reply to this proposal with your approval, and we will send the contract within 24 hours.

This proposal is valid until [Date].
`;

function ProposalModal({
  proposal, deals, onClose, onSaved
}: {
  proposal?: Proposal;
  deals: { id: string; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: proposal?.title || "",
    content: proposal?.content || PROPOSAL_TEMPLATE,
    dealId: proposal?.dealId || deals[0]?.id || "",
    totalValue: proposal?.totalValue?.toString() || "",
    validUntil: proposal?.validUntil ? new Date(proposal.validUntil).toISOString().split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title || !form.dealId) return;
    setSaving(true);
    const method = proposal ? "PATCH" : "POST";
    const url = proposal ? `/api/proposals/${proposal.id}` : "/api/proposals";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalValue: parseFloat(form.totalValue) || 0,
        validUntil: form.validUntil || undefined,
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl border border-slate-200 shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{proposal ? "Edit Proposal" : "Create Proposal"}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Proposal Title *</label>
              <input className="input" placeholder="e.g. Q2 Growth Proposal — Acme Corp"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Linked Deal *</label>
              <select className="select" value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })}>
                <option value="">Select a deal</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Value ($)</label>
              <input className="input" type="number" placeholder="15000"
                value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} />
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input className="input" type="date"
                value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Proposal Content (Markdown)</label>
            <textarea className="textarea font-mono text-xs" rows={20}
              value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving || !form.title || !form.dealId} className="btn-primary">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
            {saving ? "Saving..." : proposal ? "Update Proposal" : "Create Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalsContent() {
  const searchParams = useSearchParams();
  const defaultDealId = searchParams.get("dealId") || "";

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(!!defaultDealId);
  const [editing, setEditing] = useState<Proposal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, dRes] = await Promise.all([
      fetch("/api/proposals"),
      fetch("/api/deals"),
    ]);
    const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);
    setProposals(pData.proposals ?? []);
    setDeals(dData.deals?.map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteProposal = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <Header
        title="Proposals"
        subtitle={`${proposals.length} proposals`}
        action={{ label: "New Proposal", onClick: () => setShowCreate(true), icon: <Plus size={14} /> }}
      />

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin text-slate-300" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="card py-20 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No proposals yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Create your first proposal and close more deals</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
              <Plus size={14} /> Create Proposal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {proposals.map((p) => {
              const statusInfo = STATUS_STYLES[p.status] || STATUS_STYLES.draft;
              return (
                <div key={p.id} className="card p-5 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 shrink-0">
                    <FileText size={20} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                        {p.deal && (
                          <p className="text-xs text-slate-500 mt-0.5">Deal: {p.deal.title}</p>
                        )}
                      </div>
                      <span className={`badge text-[10px] shrink-0 ${statusInfo.cls}`}>
                        {statusInfo.icon}
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(p.totalValue)}</span>
                      <span className="text-xs text-slate-400">Created {formatDate(p.createdAt)}</span>
                      {p.sentAt && <span className="text-xs text-slate-400">Sent {formatDate(p.sentAt)}</span>}
                      {p.viewedAt && <span className="text-xs text-emerald-600">Viewed {formatDate(p.viewedAt)}</span>}
                      {p.validUntil && <span className="text-xs text-slate-400">Valid until {formatDate(p.validUntil)}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {p.status === "draft" && (
                      <button onClick={() => updateStatus(p.id, "sent")}
                        className="btn-secondary btn-sm text-xs">
                        <Send size={11} /> Send
                      </button>
                    )}
                    {p.status === "sent" && (
                      <>
                        <button onClick={() => updateStatus(p.id, "accepted")}
                          className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">
                          <Check size={11} /> Accept
                        </button>
                        <button onClick={() => updateStatus(p.id, "rejected")}
                          className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200">
                          <XCircle size={11} /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => setEditing(p)} className="btn-ghost p-1.5 rounded-lg text-slate-400">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteProposal(p.id)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showCreate || editing) && (
        <ProposalModal
          proposal={editing ?? undefined}
          deals={deals}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <RefreshCw size={20} className="animate-spin text-slate-300" />
      </div>
    }>
      <ProposalsContent />
    </Suspense>
  );
}
