"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getThemeForRole, themeVars } from "@/lib/theme";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }
      setEmail(data.user.email ?? "");
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      const out = await res.json();
      setRole(out.profile?.role ?? "");
      setReady(true);
    }
    load();
  }, [router, supabase]);

  const theme = getThemeForRole(role);
  const cssVars = themeVars(theme) as React.CSSProperties;

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F6FB" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full mx-auto mb-3 animate-pulse" style={{ background: "#F5A623" }} />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#F4F6FB", ...cssVars }}>
      <Sidebar email={email} role={role} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 256 }}>
        {typeof children === "function"
          ? (children as (role: string) => React.ReactNode)(role)
          : children}
      </main>
    </div>
  );
}