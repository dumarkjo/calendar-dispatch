import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/dispatches/check-conflicts
 * Body: { date_from, date_to, engineer_ids, technician_ids, instrument_codes, exclude_dispatch_id? }
 * Returns: { conflicts: { engineers: [...], technicians: [...], instruments: [...] } }
 *
 * Enforces:
 *   1. Direct date overlap — staff already dispatched on overlapping dates
 *   2. 1-week cooldown — staff dispatched within 7 days before date_from
 *   3. Instrument overlap — same instrument code already dispatched on overlapping dates
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      date_from,
      date_to,
      engineer_ids = [],
      technician_ids = [],
      instrument_codes = [],
      exclude_dispatch_id,
    } = body;

    if (!date_from || !date_to) {
      return NextResponse.json({ conflicts: { engineers: [], technicians: [], instruments: [] } });
    }

    // ── 1. Direct overlap query ─────────────────────────────────────────────────
    let overlapQuery = supabaseAdmin
      .from("dispatches")
      .select(`
        id, dispatch_number, date_from, date_to,
        dispatch_assignments ( staff_id, profile_id, assignment_type, staff ( full_name ), profiles ( full_name ) ),
        dispatch_instruments ( instrument_name, code_brand_model )
      `)
      .lte("date_from", date_to)
      .gte("date_to", date_from)
      .not("status", "in", '("Cancelled","Done")');

    if (exclude_dispatch_id) {
      overlapQuery = overlapQuery.neq("id", exclude_dispatch_id);
    }

    // ── 2. Cooldown query: dispatches that ended within 7 days before date_from ─
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
        dispatch_assignments ( staff_id, profile_id, assignment_type, staff ( full_name ), profiles ( full_name ) )
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

    const allStaffIds = [...engineer_ids, ...technician_ids];

    const conflictingEngineers: { name: string; dispatch_number: string; reason?: string }[] = [];
    const conflictingTechnicians: { name: string; dispatch_number: string; reason?: string }[] = [];
    const conflictingInstruments: { code: string; dispatch_number: string }[] = [];

    // Track which staff IDs already have a conflict reported (avoid duplicates)
    const reportedStaff = new Set<string>();

    // ── Check direct overlaps ───────────────────────────────────────────────────
    for (const d of overlapping ?? []) {
      const assignments: any[] = d.dispatch_assignments ?? [];
      const instruments: any[] = d.dispatch_instruments ?? [];

      for (const a of assignments.filter((x: any) =>
        ["engineer", "lead_engineer", "assistant_engineer"].includes(x.assignment_type)
      )) {
        const matchId = a.profile_id ?? a.staff_id;
        if (engineer_ids.includes(matchId) && !reportedStaff.has(matchId)) {
          reportedStaff.add(matchId);
          conflictingEngineers.push({
            name: a.profiles?.full_name ?? a.staff?.full_name ?? matchId,
            dispatch_number: d.dispatch_number,
            reason: "conflict",
          });
        }
      }

      for (const a of assignments.filter((x: any) => x.assignment_type === "technician")) {
        const matchId = a.profile_id ?? a.staff_id;
        if (technician_ids.includes(matchId) && !reportedStaff.has(matchId)) {
          reportedStaff.add(matchId);
          conflictingTechnicians.push({
            name: a.profiles?.full_name ?? a.staff?.full_name ?? matchId,
            dispatch_number: d.dispatch_number,
            reason: "conflict",
          });
        }
      }

      for (const inst of instruments) {
        const code = (inst.code_brand_model ?? "").trim();
        if (code && instrument_codes.includes(code)) {
          conflictingInstruments.push({ code, dispatch_number: d.dispatch_number });
        }
      }
    }

    // ── Check cooldown violations ───────────────────────────────────────────────
    for (const d of cooldownDispatches ?? []) {
      const assignments: any[] = d.dispatch_assignments ?? [];

      const dispatchEnd = new Date(d.date_to + "T00:00:00");
      const cooldownUntil = new Date(dispatchEnd);
      cooldownUntil.setDate(cooldownUntil.getDate() + 7);
      const cooldownUntilStr = cooldownUntil.toISOString().split("T")[0];

      for (const a of assignments.filter((x: any) =>
        ["engineer", "lead_engineer", "assistant_engineer"].includes(x.assignment_type)
      )) {
        const matchId = a.profile_id ?? a.staff_id;
        if (engineer_ids.includes(matchId) && !reportedStaff.has(matchId)) {
          reportedStaff.add(matchId);
          conflictingEngineers.push({
            name: a.profiles?.full_name ?? a.staff?.full_name ?? matchId,
            dispatch_number: d.dispatch_number,
            reason: `cooldown until ${cooldownUntilStr}`,
          });
        }
      }

      for (const a of assignments.filter((x: any) => x.assignment_type === "technician")) {
        const matchId = a.profile_id ?? a.staff_id;
        if (technician_ids.includes(matchId) && !reportedStaff.has(matchId)) {
          reportedStaff.add(matchId);
          conflictingTechnicians.push({
            name: a.profiles?.full_name ?? a.staff?.full_name ?? matchId,
            dispatch_number: d.dispatch_number,
            reason: `cooldown until ${cooldownUntilStr}`,
          });
        }
      }
    }

    return NextResponse.json({
      conflicts: {
        engineers: conflictingEngineers,
        technicians: conflictingTechnicians,
        instruments: conflictingInstruments,
      },
    });
  } catch (err) {
      return NextResponse.json({ conflicts: { engineers: [], technicians: [], instruments: [] } });
    }
}
