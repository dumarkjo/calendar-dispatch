import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/machines — returns distinct machine names from the defaults table
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("machine_instrument_defaults")
    .select("machine_name")
    .order("machine_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate (each machine appears once per instrument row)
  const names = [...new Set((data ?? []).map((r: any) => r.machine_name as string))].sort();
  return NextResponse.json({ machines: names });
}
