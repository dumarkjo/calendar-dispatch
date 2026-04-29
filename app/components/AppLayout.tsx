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
  const [fullName, setFullName] = useState("");
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth < 768;
  });

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
      if (!out.profile?.active) {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setRole(out.profile?.role ?? "");
      setFullName(out.profile?.full_name ?? "");
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
      <Sidebar
        email={email}
        fullName={fullName}
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full max-w-full overflow-x-hidden ${collapsed ? "md:ml-[72px]" : "md:ml-[256px]"}`}>
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/amtec-logo.png" alt="AMTEC" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-800 text-sm">AMTEC</span>
          </div>
          <button onClick={() => setCollapsed(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          {typeof children === "function"
            ? (children as (role: string) => React.ReactNode)(role)
            : children}
        </div>
      </main>
    </div>
  );
}
