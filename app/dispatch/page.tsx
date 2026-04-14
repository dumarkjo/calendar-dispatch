"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type DispatchType = "on_field" | "in_house";

export default function DispatchPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<DispatchType>("on_field");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD

  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      // check role using /api/me
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      const out = await res.json();
      const role = out.profile?.role ?? "";

      if (role !== "scheduler") {
        router.push("/dashboard");
        return;
      }

      setUserId(data.user.id);
      setLoading(false);
    }

    load();
  }, [router, supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Saving...");

    const res = await fetch("/api/dispatches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title,
        type,
        description,
        location,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(`Error: ${data.error ?? "Unknown error"}`);
      return;
    }

    setMsg("Saved! Dispatch created.");

    // clear form
    setTitle("");
    setType("on_field");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Create Dispatch</h1>

      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label className="block mb-1">Title</label>
          <input
            className="w-full border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Example: Site Visit - Client A"
          />
        </div>

        <div>
          <label className="block mb-1">Dispatch Type</label>
          <select
            className="w-full border p-2"
            value={type}
            onChange={(e) => setType(e.target.value as DispatchType)}
          >
            <option value="on_field">On-field (outside)</option>
            <option value="in_house">In-house (inside)</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Location</label>
          <input
            className="w-full border p-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Example: Cavite / Lab Room 2"
          />
        </div>

        <div>
          <label className="block mb-1">Start Date</label>
          <input
            className="w-full border p-2"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">End Date</label>
          <input
            className="w-full border p-2"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Description (optional)</label>
          <textarea
            className="w-full border p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Extra details..."
          />
        </div>

        <button className="border px-3 py-2">Save Dispatch</button>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}