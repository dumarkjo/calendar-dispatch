"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) { setError(error.message); setLoading(false); return; }

    // Check if account is active
    const meRes = await fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user.id }),
    });
    const meData = await meRes.json();

    if (!meData.profile?.active) {
      await supabase.auth.signOut();
      setError("Your account is not yet activated. Please wait for an admin to activate it.");
      setLoading(false);
      return;
    }

    // Best-effort: ensure profile exists (won't block login if it fails)
    try {
      await fetch("/api/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, email }),
      });
    } catch (_) { /* non-critical */ }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F6FB" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #0F1A4A 0%, #1B2A6B 100%)" }}>
        <img src="/amtec-logo.png" alt="AMTEC Logo" className="w-32 h-32 object-contain mb-6" />
        <h1 className="text-3xl font-black text-white text-center leading-tight mb-2">
          AMTEC UPLB
        </h1>
        <p className="text-center text-sm mb-1" style={{ color: "#F5A623" }}>
          Agricultural Machinery Testing
        </p>
        <p className="text-center text-sm" style={{ color: "#F5A623" }}>
          and Evaluation Center
        </p>
        <div className="mt-12 w-full max-w-xs space-y-3">
          {["Dispatch Scheduling", "Calendar View", "Engineer Assignment", "Record Keeping"].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#F5A623" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your AMTEC account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: "#D1D5DB", background: "white", color: "#111827" }}
                placeholder="you@uplb.edu.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: "#D1D5DB", background: "white", color: "#111827" }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-bold transition-all mt-2"
              style={{ background: loading ? "#9CA3AF" : "#F5A623", color: "#0F1A4A" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="font-semibold hover:underline"
              style={{ color: "#1B2A6B" }}>
              Sign up
            </button>
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/calendar-view"
              className="font-semibold hover:underline"
              style={{ color: "#1B2A6B" }}>
              📅 View Public Dispatch Calendar
            </a>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            AMTEC Dispatch Scheduler · UPLB CEAT
          </p>
        </div>
      </div>
    </div>
  );
}