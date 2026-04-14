import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── Live status recomputation ───────────────────────────────────────────────
// Overrides stale auto-computed statuses while preserving manual ones.
const MANUAL_STATUSES = new Set(["Re-scheduled", "Cancelled"]);

function computeLiveStatus(
  dateFrom: string | null,
  dateTo: string | null,
  storedStatus: string
): string {
  // Keep manually-set statuses as-is
  if (MANUAL_STATUSES.has(storedStatus)) return storedStatus;

  if (!dateFrom || !dateTo) return storedStatus || "Pending";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T00:00:00");

  if (today < from) return "Scheduled";
  if (today > to) return "Done";
  return "Ongoing";
}

// ─── Public endpoint — no auth required ──────────────────────────────────────
// Returns dispatches with just enough info for the calendar view
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("dispatches")
    .select(`
      id,
      dispatch_number,
      company_name,
      location,
      date_from,
      date_to,
      type,
      status,
      transport_mode,
      testing_location,
      notes,
      created_by_role,
      dispatch_assignments (
        id,
        assignment_type,
        staff ( id, full_name, initials )
      ),
      dispatch_machines (
        id, tam_no, machine, brand, model, serial_no, date_of_test, status
      )
    `)
    .order("date_from", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recompute status from dates so calendar always reflects live state
  const dispatches = (data ?? []).map((d: { date_from: string | null; date_to: string | null; status: string; [key: string]: unknown }) => ({
    ...d,
    status: computeLiveStatus(d.date_from, d.date_to, d.status),
  }));

  return NextResponse.json({ dispatches });
}
