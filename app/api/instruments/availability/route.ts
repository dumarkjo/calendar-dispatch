import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/instruments/availability?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&exclude_dispatch_id=...
 *
 * Returns instrument codes that are already booked on overlapping dates.
 *
 * Response shape:
 * {
 *   booked: {
 *     [code_brand_model]: { dispatch_number: string }
 *   }
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const exclude_dispatch_id = searchParams.get("exclude_dispatch_id") ?? undefined;

  if (!date_from || !date_to) {
    return NextResponse.json({ booked: {} });
  }

  let query = supabaseAdmin
    .from("dispatches")
    .select(`
      id, dispatch_number,
      dispatch_instruments ( instrument_name, code_brand_model )
    `)
    .lte("date_from", date_to)
    .gte("date_to", date_from)
    .not("status", "in", '("Cancelled","Done")');

  if (exclude_dispatch_id) {
    query = query.neq("id", exclude_dispatch_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const booked: Record<string, { dispatch_number: string }> = {};

  for (const d of data ?? []) {
    for (const inst of d.dispatch_instruments ?? []) {
      const code = (inst.code_brand_model ?? "").trim();
      if (code && !booked[code]) {
        booked[code] = { dispatch_number: d.dispatch_number };
      }
    }
  }

  return NextResponse.json({ booked });
}
