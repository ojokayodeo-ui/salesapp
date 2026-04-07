"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, RefreshCw, UserPlus, Check } from "lucide-react";

const FEATURES = [
  "Visual Kanban pipeline (9 stages)",
  "Lead management & CSV import",
  "AI-powered email & proposal generation",
  "Analytics & funnel reporting",
  "Automation workflows",
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", orgName: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Value prop */}
        <div className="hidden lg:block text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">Revenue OS</p>
              <p className="text-xs text-brand-300 mt-0.5">All-in-One Sales System</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-4">
            Close more deals.<br />
            <span className="text-brand-300">Faster.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Revenue OS gives your sales team everything they need to capture leads,
            move deals through the pipeline, and hit their numbers — powered by AI.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-brand-300" />
                </div>
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Revenue OS</span>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Start your free trial — no credit card required</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Organization / Company Name</label>
                <input
                  className="input"
                  placeholder="Acme Sales Inc."
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Your Full Name</label>
                <input
                  className="input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label">Work Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="jane@acme.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-semibold"
            >
              {loading ? (
                <><RefreshCw size={15} className="animate-spin" /> Creating account...</>
              ) : (
                <><UserPlus size={15} /> Create Free Account</>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
