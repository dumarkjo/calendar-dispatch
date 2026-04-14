"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      await fetch("/api/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, email: data.user.email }),
      });
    }

    router.push("/dashboard");
  }

  async function handleSignUp() {
    setError("");
    setMsg("");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);

    setMsg("Signup success. Now try Login.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 p-6 border rounded space-y-4">
        <h1 className="text-xl font-bold">Login</h1>

        {error && <p className="text-red-600">{error}</p>}
        {msg && <p className="text-green-600">{msg}</p>}

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            className="w-full border p-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full bg-black text-white p-2">Login</button>
        </form>

        <button onClick={handleSignUp} className="w-full border p-2">
          Sign Up (temporary)
        </button>
      </div>
    </div>
  );
}