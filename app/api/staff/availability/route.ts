import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/staff/availability?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&exclude_dispatch_id=...
 *
 * Returns unavailable staff IDs with the reason:
 *   - "conflict"  → already dispatched on overlapping dates
 *   - "cooldown"  → dispatched within 7 days before date_from
 *
 * Response shape:
 * {
 *   unavailable: {
 *     [staff_id]: { reason: "conflict" | "cooldown", dispatch_number: string, until?: string }
 *   }
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const exclude_dispatch_id = searchParams.get("exclude_dispatch_id") ?? undefined;

  if (!date_from || !date_to) {
    return NextResponse.json({ unavailable: {} });
  }

  // ── 1. Direct overlap: dispatches whose dates overlap [date_from, date_to] ──
  let overlapQuery = supabaseAdmin
    .from("dispatches")
    .select(`
      id, dispatch_number, date_from, date_to,
      dispatch_assignments ( staff_id, profile_id, assignment_type )
    `)
    .lte("date_from", date_to)
    .gte("date_to", date_from)
    .not("status", "in", '("Cancelled","Done")');

  if (exclude_dispatch_id) {
    overlapQuery = overlapQuery.neq("id", exclude_dispatch_id);
  }

  // ── 2. Cooldown: dispatches that ended within 7 days before date_from ───────
  // Cooldown window: (date_from - 7 days) <= date_to <= (date_from - 1 day)
  const dateFromObj = new Date(date_from + "T00:00:00");
  const cooldownStart = new Date(dateFromObj);
  cooldownStart.setDate(cooldownStart.getDate() - 7);
  const cooldownEnd = new Date(dateFromObj);
  cooldownEnd.setDate(cooldownEnd.getDate() - 1);

  const cooldownStartStr = cooldownStart.toISOString().split("T")[0];
  const cooldownEndStr = cooldownEnd.toISOString().split("T")[0];

  let cooldownQuery = supabaseAdmin
    .from("dispatches")
    .select(`
      id, dispatch_number, date_from, date_to,
      dispatch_assignments ( staff_id, profile_id, assignment_type )
    `)
    .gte("date_to", cooldownStartStr)
    .lte("date_to", cooldownEndStr)
    .not("status", "in", '("Cancelled","Done")');

  if (exclude_dispatch_id) {
    cooldownQuery = cooldownQuery.neq("id", exclude_dispatch_id);
  }

  const [{ data: overlapping, error: overlapErr }, { data: cooldownDispatches, error: cooldownErr }] =
    await Promise.all([overlapQuery, cooldownQuery]);

  if (overlapErr) return NextResponse.json({ error: overlapErr.message }, { status: 500 });
  if (cooldownErr) return NextResponse.json({ error: cooldownErr.message }, { status: 500 });

  const unavailable: Record<string, { reason: "conflict" | "cooldown"; dispatch_number: string; until?: string }> = {};

  // Mark conflict staff (direct overlap takes priority over cooldown)
  for (const d of overlapping ?? []) {
    const assignments: any[] = d.dispatch_assignments ?? [];
    for (const a of assignments) {
      if (!a.staff_id && !a.profile_id) continue;
      const matchId = a.staff_id ?? a.profile_id;
      // Only flag engineers and technicians
      if (!["engineer", "lead_engineer", "assistant_engineer", "technician"].includes(a.assignment_type)) continue;
      unavailable[matchId] = {
        reason: "conflict",
        dispatch_number: d.dispatch_number,
      };
    }
  }

  // Mark cooldown staff (only if not already marked as conflict)
  for (const d of cooldownDispatches ?? []) {
    const assignments: any[] = d.dispatch_assignments ?? [];
    // Cooldown ends 7 days after dispatch date_to
    const dispatchEnd = new Date(d.date_to + "T00:00:00");
    const cooldownUntil = new Date(dispatchEnd);
    cooldownUntil.setDate(cooldownUntil.getDate() + 7);
    const cooldownUntilStr = cooldownUntil.toISOString().split("T")[0];

    for (const a of assignments) {
      if (!a.staff_id && !a.profile_id) continue;
      const matchId = a.staff_id ?? a.profile_id;
      if (!["engineer", "lead_engineer", "assistant_engineer", "technician"].includes(a.assignment_type)) continue;
      // Don't overwrite a direct conflict
      if (unavailable[matchId]?.reason === "conflict") continue;
      unavailable[matchId] = {
        reason: "cooldown",
        dispatch_number: d.dispatch_number,
        until: cooldownUntilStr,
      };
    }
  }

  return NextResponse.json({ unavailable });
}
