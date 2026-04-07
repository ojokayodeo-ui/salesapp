"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, RefreshCw, LogIn } from "lucide-react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
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
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">Revenue OS</p>
            <p className="text-xs text-brand-300 mt-0.5">All-in-One Sales System</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-semibold"
            >
              {loading ? (
                <><RefreshCw size={15} className="animate-spin" /> Signing in...</>
              ) : (
                <><LogIn size={15} /> Sign In</>
              )}
            </button>
          </form>

          {/* Demo login hint */}
          <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
            <p className="text-xs text-brand-700 font-medium">Demo credentials:</p>
            <p className="text-xs text-brand-600 mt-0.5">Email: <strong>admin@acme.com</strong></p>
            <p className="text-xs text-brand-600">Password: <strong>password123</strong></p>
            <button
              type="button"
              onClick={() => setForm({ email: "admin@acme.com", password: "password123" })}
              className="mt-2 text-xs text-brand-700 underline hover:no-underline"
            >
              Fill demo credentials
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
