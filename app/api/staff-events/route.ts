import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireAccess";

/**
 * GET /api/staff-events?year=2026&month=3
 * Public — returns all staff calendar events for a given month
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const now = new Date();
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data, error } = await supabaseAdmin
    .from("staff_calendar_events")
    .select("id, profile_id, event_date, event_type, notes")
    .gte("event_date", from)
    .lte("event_date", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [] });
}

/**
 * POST /api/staff-events
 * Admin/scheduler only — create or update a staff calendar event
 * Body: { profile_id, event_date, event_type, notes? }
 */
export async function POST(req: Request) {
  const auth = await requireRole(req, "admin_scheduler", "mechanical_lab");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { profile_id, event_date, event_type, notes } = body;

  if (!profile_id || !event_date || !event_type) {
    return NextResponse.json({ error: "profile_id, event_date, and event_type are required" }, { status: 400 });
  }

  const validTypes = ["day_off", "scheduler", "wfh", "meeting", "email", "no_pasok"];
  if (!validTypes.includes(event_type)) {
    return NextResponse.json({ error: `Invalid event_type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Upsert: update if exists, insert if not
  const { data, error } = await supabaseAdmin
    .from("staff_calendar_events")
    .upsert(
      {
        profile_id,
        event_date,
        event_type,
        notes: notes ?? null,
        created_by: auth.data.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,event_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ event: data });
}

/**
 * DELETE /api/staff-events
 * Admin/scheduler only — remove a staff calendar event
 * Body: { profile_id, event_date }
 */
export async function DELETE(req: Request) {
  const auth = await requireRole(req, "admin_scheduler", "mechanical_lab");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { profile_id, event_date } = body;

  if (!profile_id || !event_date) {
    return NextResponse.json({ error: "profile_id and event_date are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("staff_calendar_events")
    .delete()
    .eq("profile_id", profile_id)
    .eq("event_date", event_date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
