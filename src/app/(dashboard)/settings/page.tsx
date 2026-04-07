"use client";

import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, User, Building2, Key, Bell, Link2, Shield, ChevronRight } from "lucide-react";

const INTEGRATIONS = [
  { name: "Gmail",           desc: "Sync emails and track opens",     icon: "📧", available: false },
  { name: "Google Calendar", desc: "Sync meetings and reminders",      icon: "📅", available: false },
  { name: "Outlook",         desc: "Microsoft email and calendar",     icon: "📨", available: false },
  { name: "Zapier",          desc: "Connect 5,000+ apps via webhooks", icon: "⚡", available: false },
  { name: "LinkedIn Sales",  desc: "Import LinkedIn prospects",        icon: "💼", available: false },
  { name: "Stripe",          desc: "Sync payment and invoice data",    icon: "💳", available: false },
];

export default function SettingsPage() {
  const { user } = useAuth();

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
          <div className="p-6 space-y-4">
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label">Full Name</label>
                <input className="input" defaultValue={user?.name} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" defaultValue={user?.email} />
              </div>
            </div>
            <button className="btn-primary btn-sm">Save Changes</button>
          </div>
        </div>

        {/* Organization */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Building2 size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Organization</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Organization Name</label>
                <input className="input" defaultValue={user?.organization?.name} />
              </div>
              <div>
                <label className="label">Plan</label>
                <div className="flex items-center gap-2">
                  <input className="input" defaultValue={user?.organization?.plan} readOnly />
                  <button className="btn-secondary btn-sm whitespace-nowrap">Upgrade</button>
                </div>
              </div>
            </div>
          </div>
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
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
            </div>
            <button className="btn-secondary btn-sm">Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
