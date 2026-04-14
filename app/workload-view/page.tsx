"use client";
import { useEffect, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Assignment = {
  id: string;
  profile_id: string;
  assignment_type: string;
  profiles: { id: string; full_name: string; initials: string | null } | null;
};

type Machine = {
  id: string;
  tam_no: string | null;
  machine: string | null;
  brand: string | null;
  model: string | null;
};

type DispatchSummary = {
  id: string;
  dispatch_number: string | null;
  company_name: string | null;
  date_from: string | null;
  date_to: string | null;
  status: string;
};

type DispatchFull = DispatchSummary & {
  transport_mode: string | null;
  testing_location: string | null;
  location: string | null;
  type: string | null;
  contact_person: string | null;
  contact_number: string | null;
  dispatch_assignments: Assignment[];
  dispatch_machines: Machine[];
};

type StaffWorkload = {
  id: string;
  full_name: string;
  initials: string | null;
  role: string;
  dispatch_count: number;
  travel_days: number;
  machine_count: number;
  dispatches: DispatchSummary[];
};

type CalendarEvent = {
  id: string;
  profile_id: string;
  event_date: string;
  event_type: string;
  notes: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];

const TRANSPORT_LABELS: Record<string, string> = {
  public_conveyance: "Public Conveyance",
  test_applicant_vehicle: "Applicant Vehicle",
  college_vehicle: "College Vehicle",
  other: "Other",
};

// Event types with markers + colors
const EVENT_TYPES: Record<string, { label: string; marker: string; bg: string; text: string }> = {
  scheduler:  { label: "Scheduler",       marker: "S", bg: "#86EFAC", text: "#14532D" },
  wfh:        { label: "Work from Home",  marker: "W", bg: "#86EFAC", text: "#14532D" },
  meeting:    { label: "Meeting (Main)",  marker: "M", bg: "#86EFAC", text: "#14532D" },
  email:      { label: "Email",           marker: "m", bg: "#86EFAC", text: "#14532D" },
  day_off:    { label: "Day Off / Leave", marker: "",  bg: "#D1D5DB", text: "#374151" },
  no_pasok:   { label: "No Pasok",        marker: "",  bg: "#C4B5FD", text: "#4C1D95" },
};

// Legend for the calendar
const LEGEND = [
  { bg: "#FCD34D", text: "#78350F", marker: "S", label: "Scheduled (With dispatch)" },
  { bg: "#93C5FD", text: "#1E3A8A", marker: "",  label: "No dispatch yet" },
  { bg: "#D1D5DB", text: "#374151", marker: "",  label: "Day Off / Leave / Offset" },
  { bg: "#86EFAC", text: "#14532D", marker: "S", label: "S = Scheduler" },
  { bg: "#86EFAC", text: "#14532D", marker: "W", label: "W = Work from Home" },
  { bg: "#86EFAC", text: "#14532D", marker: "M", label: "M = Meeting (Main)" },
  { bg: "#86EFAC", text: "#14532D", marker: "m", label: "m = Email" },
  { bg: "#10B981", text: "#fff",    marker: "✓", label: "Trip accomplished" },
  { bg: "#C4B5FD", text: "#4C1D95", marker: "",  label: "No Pasok (Holiday)" },
];

// Dispatch status → cell style (for dispatched days)
function getDispatchCellStyle(status: string): { bg: string; text: string; marker: string } {
  switch (status) {
    case "Scheduled": return { bg: "#FCD34D", text: "#78350F", marker: "S" };
    case "Ongoing":   return { bg: "#FCD34D", text: "#78350F", marker: "●" };
    case "Done":      return { bg: "#10B981", text: "#fff",    marker: "✓" };
    case "Cancelled": return { bg: "#C4B5FD", text: "#4C1D95", marker: "✕" };
    case "Re-scheduled": return { bg: "#FCD34D", text: "#78350F", marker: "R" };
    case "Pending":   return { bg: "#FCD34D", text: "#78350F", marker: "P" };
    default:          return { bg: "#93C5FD", text: "#1E3A8A", marker: "" };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseLocalDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function buildDayMap(dispatches: DispatchSummary[], year: number, month: number): Record<number, DispatchSummary> {
  const map: Record<number, DispatchSummary> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (const d of dispatches) {
    if (!d.date_from || !d.date_to) continue;
    const from = parseLocalDate(d.date_from);
    const to = parseLocalDate(d.date_to);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (date >= from && date <= to) map[day] = d;
    }
  }
  return map;
}

function getDayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
type TooltipInfo = { x: number; y: number; dispatch?: DispatchSummary; event?: CalendarEvent; personName: string };

// ─── Event Edit Modal ────────────────────────────────────────────────────────
function EventModal({ personName, dateKey, current, onSave, onDelete, onClose }: {
  personName: string;
  dateKey: string;
  current: CalendarEvent | null;
  onSave: (eventType: string, notes: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [eventType, setEventType] = useState(current?.event_type ?? "day_off");
  const [notes, setNotes] = useState(current?.notes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100" style={{ background: "#F8F9FB" }}>
          <h3 className="text-sm font-black text-gray-800">
            {current ? "Edit" : "Add"} Calendar Event
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{personName} · {dateKey}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Event Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, et]) => (
                <button key={key}
                  onClick={() => setEventType(key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-xs font-medium"
                  style={{
                    borderColor: eventType === key ? "#1B2A6B" : "#E5E7EB",
                    background: eventType === key ? "#EEF1FB" : "white",
                    color: eventType === key ? "#1B2A6B" : "#6B7280",
                  }}>
                  <span className="w-5 h-5 rounded flex items-center justify-center font-black"
                    style={{ background: et.bg, color: et.text, fontSize: "0.65rem" }}>
                    {et.marker || "—"}
                  </span>
                  {et.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes (optional)</label>
            <input className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: "#D1D5DB" }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. half day only" />
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100" style={{ background: "#F8F9FB" }}>
          <div>
            {current && (
              <button onClick={onDelete}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                Remove Event
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={() => onSave(eventType, notes)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: "#1B2A6B" }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function WorkloadViewPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workload, setWorkload] = useState<StaffWorkload[]>([]);
  const [dispatchList, setDispatchList] = useState<DispatchFull[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ personId: string; personName: string; dateKey: string } | null>(null);

  // Check admin status — get Supabase session, then verify role via /api/me
  useEffect(() => {
    (async () => {
      try {
        const { supabaseBrowser } = await import("@/lib/supabase/client");
        const { data: sessionData } = await supabaseBrowser().auth.getSession();
        const session = sessionData.session;
        if (!session) return;
        setAuthToken(session.access_token);
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const d = await res.json();
        if (d.profile && ["admin_scheduler", "mechanical_lab"].includes(d.profile.role)) {
          setIsAdmin(true);
        }
      } catch { /* not logged in — that's fine, public page */ }
    })();
  }, []);

  const load = useCallback((y: number, m: number) => {
    setLoading(true);
    Promise.all([
      fetch(`/api/public/workload?year=${y}&month=${m}`).then(r => r.json()),
      fetch(`/api/staff-events?year=${y}&month=${m}`).then(r => r.json()),
    ]).then(([wData, eData]) => {
      setWorkload(wData.workload ?? []);
      setDispatchList(wData.dispatchList ?? []);
      setEvents(eData.events ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  function prevMonth() {
    setMonth(m => { const nm = m === 1 ? 12 : m - 1; if (m === 1) setYear(y => y - 1); return nm; });
  }
  function nextMonth() {
    setMonth(m => { const nm = m === 12 ? 1 : m + 1; if (m === 12) setYear(y => y + 1); return nm; });
  }

  // Event lookup
  function getEvent(personId: string, dateKey: string): CalendarEvent | undefined {
    return events.find(e => e.profile_id === personId && e.event_date === dateKey);
  }

  // Save event
  async function saveEvent(personId: string, dateKey: string, eventType: string, notes: string) {
    if (!authToken) return;
    try {
      await fetch("/api/staff-events", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ profile_id: personId, event_date: dateKey, event_type: eventType, notes }),
      });
      load(year, month);
    } catch { /* silent */ }
    setEditModal(null);
  }

  // Delete event
  async function deleteEvent(personId: string, dateKey: string) {
    if (!authToken) return;
    try {
      await fetch("/api/staff-events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ profile_id: personId, event_date: dateKey }),
      });
      load(year, month);
    } catch { /* silent */ }
    setEditModal(null);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null;

  const engineers = workload.filter(w => w.role === "engineer");
  const technicians = workload.filter(w => w.role === "technician");

  // Busy count per day
  const busyPerDay: Record<number, number> = {};
  for (const day of days) {
    busyPerDay[day] = workload.filter(w => buildDayMap(w.dispatches, year, month)[day] !== undefined).length;
  }

  return (
    <div className="min-h-screen" style={{ background: "#F4F6FB", fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ background: "linear-gradient(90deg, #0F1A4A 0%, #1B2A6B 100%)" }}>
        <div className="flex items-center gap-3">
          <img src="/amtec-logo.png" alt="AMTEC" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-white font-black text-sm leading-none">AMTEC UPLB</p>
            <p className="text-xs" style={{ color: "#F5A623" }}>Staff Workload Calendar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: "#F5A623", color: "#0F1A4A" }}>
              ✏️ Edit Mode
            </span>
          )}
          <a href="/calendar-view"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-all">
            📅 Calendar
          </a>
          <a href="/login"
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "#F5A623", color: "#0F1A4A" }}>
            Staff Login
          </a>
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {MONTHS[month - 1]} {year} — Workload Calendar
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {workload.length} active staff · {dispatchList.length} dispatches this month
              {isAdmin && " · Click any empty cell to add events"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold transition-all">‹</button>
            <button onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all">This Month</button>
            <button onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold transition-all">›</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Legend:</span>
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-5 h-4 rounded-sm flex items-center justify-center font-black"
                style={{ background: l.bg, color: l.text, fontSize: "0.6rem" }}>
                {l.marker}
              </span>
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading workload...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ──────────────────── CALENDAR GRID ──────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-auto shadow-sm mb-6"
              style={{ fontSize: "0.7rem" }}>
              <table className="border-collapse" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 border-b border-r border-gray-200 px-3 py-2 text-left"
                      style={{ minWidth: 160, background: "#F8F9FB" }}>
                      <span className="text-xs font-bold text-gray-600">NAME</span>
                    </th>
                    <th className="border-b border-r border-gray-200 px-1 py-2 text-center"
                      style={{ minWidth: 40, background: "#F8F9FB" }}>
                      <span className="text-xs font-bold text-gray-600">TRAVEL<br/>DAYS</span>
                    </th>
                    <th className="border-b border-r border-gray-200 px-1 py-2 text-center"
                      style={{ minWidth: 40, background: "#F8F9FB" }}>
                      <span className="text-xs font-bold text-gray-600">REPORT<br/>WKLD</span>
                    </th>
                    <th className="border-b border-r border-gray-200 px-1 py-2 text-center"
                      style={{ minWidth: 40, background: "#F8F9FB" }}>
                      <span className="text-xs font-bold text-gray-600">MACH<br/>TESTED</span>
                    </th>
                    {days.map(d => {
                      const date = new Date(year, month - 1, d);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = d === todayDay;
                      return (
                        <th key={d}
                          className="border-b border-r border-gray-200 text-center py-1"
                          style={{
                            minWidth: 28, width: 28,
                            background: isToday ? "#FEF3C7" : isWeekend ? "#F8F9FB" : "white",
                          }}>
                          <div className="font-bold" style={{ color: isToday ? "#F59E0B" : isWeekend ? "#9CA3AF" : "#374151" }}>
                            {d}
                          </div>
                          <div style={{ color: "#9CA3AF", fontSize: "0.6rem" }}>
                            {["Su","Mo","Tu","We","Th","Fr","Sa"][date.getDay()]}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Engineers */}
                  {engineers.length > 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 4} className="px-3 py-1 border-b border-gray-100"
                        style={{ background: "#EEF1FB" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#1B2A6B" }}>
                          ● Testing Engineers ({engineers.length})
                        </span>
                      </td>
                    </tr>
                  )}
                  {engineers.map((person, idx) => (
                    <StaffRow key={person.id} person={person} days={days} year={year} month={month}
                      idx={idx} todayDay={todayDay} onTooltip={setTooltip} events={events}
                      isAdmin={isAdmin} onCellClick={(dateKey) => setEditModal({ personId: person.id, personName: person.full_name, dateKey })}
                      getEvent={getEvent} />
                  ))}

                  {/* Technicians */}
                  {technicians.length > 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 4} className="px-3 py-1 border-b border-gray-100"
                        style={{ background: "#ECFDF5" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#065F46" }}>
                          ● Technicians ({technicians.length})
                        </span>
                      </td>
                    </tr>
                  )}
                  {technicians.map((person, idx) => (
                    <StaffRow key={person.id} person={person} days={days} year={year} month={month}
                      idx={idx} todayDay={todayDay} onTooltip={setTooltip} events={events}
                      isAdmin={isAdmin} onCellClick={(dateKey) => setEditModal({ personId: person.id, personName: person.full_name, dateKey })}
                      getEvent={getEvent} />
                  ))}

                  {/* Busy count footer */}
                  <tr style={{ background: "#F8F9FB" }}>
                    <td className="sticky left-0 z-10 px-3 py-1.5 font-black text-gray-500 border-t border-gray-200 text-right"
                      style={{ background: "#F8F9FB" }}>Busy:</td>
                    <td className="border-t border-gray-200" colSpan={3} />
                    {days.map(d => (
                      <td key={d} className="border-t border-r border-gray-200 text-center py-1">
                        {busyPerDay[d] > 0 ? (
                          <span className="font-black" style={{ color: "#1B2A6B" }}>{busyPerDay[d]}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ──────────────────── DISPATCH LIST TABLE ──────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-auto shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100" style={{ background: "#F8F9FB" }}>
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                  📋 Dispatch List — {MONTHS[month - 1]} {year}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{dispatchList.length} dispatches</p>
              </div>
              {dispatchList.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-400">No dispatches this month.</p>
                </div>
              ) : (
                <div className="overflow-x-auto" style={{ fontSize: "0.75rem" }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: "#F8F9FB" }}>
                        {["Dispatch #", "Status", "Departure", "Arrival", "Lead Engr.", "Asst. Engr.", "Technician",
                          "Applicant/s", "Location", "Machinery", "TAM", "Transport", "Contact Person", "Contact No."].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchList.map((d, idx) => {
                        const leadEngineer = d.dispatch_assignments?.find(a => a.assignment_type === "lead_engineer");
                        const assistants = d.dispatch_assignments?.filter(a => a.assignment_type === "assistant_engineer") ?? [];
                        const techs = d.dispatch_assignments?.filter(a => a.assignment_type === "technician") ?? [];
                        const cellStyle = getDispatchCellStyle(d.status);

                        return (
                          <tr key={d.id} style={{ background: idx % 2 === 0 ? "white" : "#FAFAFA" }}
                            className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-3 py-2 border-b border-gray-100 font-mono font-semibold text-gray-700 whitespace-nowrap">
                              {d.dispatch_number ?? "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                                style={{ background: cellStyle.bg, color: cellStyle.text }}>
                                {d.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{d.date_from ?? "—"}</td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{d.date_to ?? "—"}</td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-700 font-medium whitespace-nowrap">
                              {leadEngineer?.profiles?.full_name ?? "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                              {assistants.length > 0 ? assistants.map(a => a.profiles?.full_name).join(", ") : "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                              {techs.length > 0 ? techs.map(a => a.profiles?.full_name).join(", ") : "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-700 font-medium">{d.company_name ?? "—"}</td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                              {d.type === "in_house" ? "AMTEC" : (d.testing_location ?? d.location ?? "—")}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                              {d.dispatch_machines?.length > 0
                                ? d.dispatch_machines.map(m => m.machine).filter(Boolean).join(", ") || "—"
                                : "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 font-mono">
                              {d.dispatch_machines?.length > 0
                                ? d.dispatch_machines.map(m => m.tam_no).filter(Boolean).join(", ") || "—"
                                : "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">
                              {TRANSPORT_LABELS[d.transport_mode ?? ""] ?? d.transport_mode ?? "—"}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600">{d.contact_person ?? "—"}</td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 font-mono">{d.contact_number ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && workload.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF1FB" }}>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-base font-bold text-gray-700">No active staff found</p>
            <p className="text-sm text-gray-400 mt-1">Make sure staff are marked active in the admin panel.</p>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl shadow-xl border border-gray-200 p-3"
          style={{
            left: Math.min(tooltip.x + 12, typeof window !== "undefined" ? window.innerWidth - 240 : 800),
            top: Math.min(tooltip.y + 12, typeof window !== "undefined" ? window.innerHeight - 160 : 600),
            background: "white", width: 220,
          }}>
          <p className="text-xs font-bold text-gray-400">{tooltip.personName}</p>
          {tooltip.dispatch && (
            <>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{tooltip.dispatch.dispatch_number ?? "—"}</p>
              <p className="text-sm font-black text-gray-900 mt-0.5 leading-tight">
                {tooltip.dispatch.company_name ?? "Untitled"}
              </p>
              <div className="mt-1.5">
                {(() => {
                  const s = getDispatchCellStyle(tooltip.dispatch!.status);
                  return (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.text }}>
                      {tooltip.dispatch!.status}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {tooltip.dispatch.date_from} → {tooltip.dispatch.date_to}
              </p>
            </>
          )}
          {tooltip.event && (
            <>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {EVENT_TYPES[tooltip.event.event_type]?.label ?? tooltip.event.event_type}
              </p>
              {tooltip.event.notes && (
                <p className="text-xs text-gray-400 mt-0.5">{tooltip.event.notes}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EventModal
          personName={editModal.personName}
          dateKey={editModal.dateKey}
          current={getEvent(editModal.personId, editModal.dateKey) ?? null}
          onSave={(type, notes) => saveEvent(editModal.personId, editModal.dateKey, type, notes)}
          onDelete={() => deleteEvent(editModal.personId, editModal.dateKey)}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

// ─── Staff Row ───────────────────────────────────────────────────────────────
function StaffRow({ person, days, year, month, idx, todayDay, onTooltip, events, isAdmin, onCellClick, getEvent }: {
  person: StaffWorkload;
  days: number[];
  year: number;
  month: number;
  idx: number;
  todayDay: number | null;
  onTooltip: (t: TooltipInfo | null) => void;
  events: CalendarEvent[];
  isAdmin: boolean;
  onCellClick: (dateKey: string) => void;
  getEvent: (personId: string, dateKey: string) => CalendarEvent | undefined;
}) {
  const dayMap = buildDayMap(person.dispatches, year, month);
  const isEngineer = person.role === "engineer";
  const rowBg = idx % 2 === 0 ? "white" : "#FAFAFA";

  return (
    <tr style={{ background: rowBg }}>
      {/* Name cell */}
      <td className="sticky left-0 z-10 px-3 py-1.5 border-b border-r border-gray-100"
        style={{ background: rowBg, minWidth: 160 }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center font-black flex-shrink-0"
            style={{
              background: isEngineer ? "#EEF1FB" : "#ECFDF5",
              color: isEngineer ? "#1B2A6B" : "#065F46",
              fontSize: "0.6rem",
            }}>
            {person.initials ?? person.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-800 truncate" style={{ maxWidth: 120 }}>
            {person.full_name}
          </span>
        </div>
      </td>
      {/* Stats columns */}
      <td className="border-b border-r border-gray-100 text-center py-1.5 font-black"
        style={{ color: person.travel_days > 0 ? "#1B2A6B" : "#9CA3AF" }}>
        {person.travel_days > 0 ? person.travel_days : "—"}
      </td>
      <td className="border-b border-r border-gray-100 text-center py-1.5 font-bold"
        style={{ color: person.dispatch_count > 0 ? "#7C3AED" : "#9CA3AF" }}>
        {person.dispatch_count > 0 ? person.dispatch_count : "—"}
      </td>
      <td className="border-b border-r border-gray-100 text-center py-1.5 font-bold"
        style={{ color: person.machine_count > 0 ? "#059669" : "#9CA3AF" }}>
        {person.machine_count > 0 ? person.machine_count : "—"}
      </td>
      {/* Day cells */}
      {days.map(d => {
        const dispatch = dayMap[d];
        const dateKey = getDayKey(year, month, d);
        const event = getEvent(person.id, dateKey);
        const date = new Date(year, month - 1, d);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isToday = d === todayDay;

        // Priority: dispatch > event > default
        let cellBg: string;
        let cellText: string;
        let cellMarker: string;

        if (dispatch) {
          const s = getDispatchCellStyle(dispatch.status);
          cellBg = s.bg;
          cellText = s.text;
          cellMarker = s.marker;
        } else if (event) {
          const et = EVENT_TYPES[event.event_type];
          cellBg = et?.bg ?? "#D1D5DB";
          cellText = et?.text ?? "#374151";
          cellMarker = et?.marker ?? "";
        } else {
          cellBg = isToday ? "#FEF9EC" : isWeekend ? "#F8F9FB" : rowBg;
          cellText = "#9CA3AF";
          cellMarker = "";
        }

        const clickable = isAdmin && !dispatch; // admin can edit non-dispatch cells

        return (
          <td key={d}
            className="border-b border-r border-gray-100 text-center transition-all"
            style={{
              background: cellBg,
              cursor: clickable ? "pointer" : dispatch ? "default" : "default",
            }}
            onClick={clickable ? () => onCellClick(dateKey) : undefined}
            onMouseEnter={(dispatch || event) ? (e) => onTooltip({
              x: e.clientX, y: e.clientY,
              dispatch: dispatch ?? undefined,
              event: event ?? undefined,
              personName: person.full_name,
            }) : undefined}
            onMouseLeave={() => onTooltip(null)}
            onMouseMove={(dispatch || event) ? (e) => onTooltip({
              x: e.clientX, y: e.clientY,
              dispatch: dispatch ?? undefined,
              event: event ?? undefined,
              personName: person.full_name,
            }) : undefined}>
            <div className="h-6 flex items-center justify-center">
              {cellMarker && (
                <span className="font-black" style={{ color: cellText, fontSize: "0.6rem" }}>
                  {cellMarker}
                </span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
