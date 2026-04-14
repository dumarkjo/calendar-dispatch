import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/machine-instruments?machine=Rice+Transplanter
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const machineName = searchParams.get("machine")?.trim();

  if (!machineName) {
    return NextResponse.json({ instrument_names: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("machine_instrument_defaults")
    .select("instrument_name")
    .eq("machine_name", machineName)
    .order("instrument_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const instrument_names = (data ?? []).map((r: any) => r.instrument_name);
  return NextResponse.json({ instrument_names });
}
