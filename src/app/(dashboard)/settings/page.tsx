"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { User, Building2, Bell, Link2, Shield, Check, RefreshCw } from "lucide-react";

const INTEGRATIONS = [
  { name: "Gmail",           desc: "Sync emails and track opens",     icon: "📧" },
  { name: "Google Calendar", desc: "Sync meetings and reminders",      icon: "📅" },
  { name: "Outlook",         desc: "Microsoft email and calendar",     icon: "📨" },
  { name: "Zapier",          desc: "Connect 5,000+ apps via webhooks", icon: "⚡" },
  { name: "LinkedIn Sales",  desc: "Import LinkedIn prospects",        icon: "💼" },
  { name: "Stripe",          desc: "Sync payment and invoice data",    icon: "💳" },
];

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary btn-sm">
      {loading ? (
        <><RefreshCw size={13} className="animate-spin" /> Saving...</>
      ) : saved ? (
        <><Check size={13} className="text-emerald-300" /> Saved</>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [orgName, setOrgName] = useState(user?.organization?.name ?? "");
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, email: profile.email }),
    });
    if (res.ok) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      await refresh();
    } else {
      const d = await res.json();
      setProfileError(d.error || "Failed to save");
    }
    setProfileSaving(false);
  };

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    const res = await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName }),
    });
    if (res.ok) {
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 3000);
      await refresh();
    }
    setOrgSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (passwords.next.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    setPwSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
    });
    if (res.ok) {
      setPwSaved(true);
      setPasswords({ current: "", next: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } else {
      const d = await res.json();
      setPwError(d.error || "Failed to update password");
    }
    setPwSaving(false);
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and organization" />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Profile */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <User size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
          </div>
          <form onSubmit={saveProfile} className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-lg font-bold text-white">
                {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <span className="badge bg-brand-50 text-brand-700 text-[10px] mt-1 capitalize">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            </div>

            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{profileError}</div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
              </div>
            </div>
            <SaveButton loading={profileSaving} saved={profileSaved} />
          </form>
        </div>

        {/* Organization */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Building2 size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Organization</h3>
          </div>
          <form onSubmit={saveOrg} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Organization Name</label>
                <input className="input" value={orgName}
                  onChange={(e) => setOrgName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Plan</label>
                <div className="flex items-center gap-2">
                  <input className="input" value={user?.organization?.plan ?? ""} readOnly />
                  <span className="btn-secondary btn-sm whitespace-nowrap opacity-50 cursor-not-allowed">Upgrade</span>
                </div>
              </div>
            </div>
            {["owner", "admin"].includes(user?.role ?? "") && (
              <SaveButton loading={orgSaving} saved={orgSaved} />
            )}
          </form>
        </div>

        {/* Integrations */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Link2 size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Integrations</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {INTEGRATIONS.map((int) => (
              <div key={int.name} className="flex items-center gap-4 px-6 py-4">
                <span className="text-xl w-8 text-center">{int.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{int.name}</p>
                  <p className="text-xs text-slate-500">{int.desc}</p>
                </div>
                <button className="btn-secondary btn-sm opacity-50 cursor-not-allowed" disabled>
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Bell size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              "New deal created",
              "Deal stage changed",
              "Activity due reminder",
              "Proposal viewed by client",
              "Deal closed (won/lost)",
              "Weekly pipeline report",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm text-slate-700">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Shield size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Security</h3>
          </div>
          <form onSubmit={savePassword} className="p-6 space-y-4">
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{pwError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" placeholder="Min. 8 characters"
                  value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required />
              </div>
            </div>
            <SaveButton loading={pwSaving} saved={pwSaved} />
          </form>
        </div>
      </div>
    </div>
  );
}
