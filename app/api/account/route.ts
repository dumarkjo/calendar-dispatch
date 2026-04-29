import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/requireAccess";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const auth = await getAuthUser(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, surname, initials, designation, role, lab, active")
    .eq("id", auth.data.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: data,
    email: auth.data.user.email ?? "",
  });
}

export async function PUT(req: Request) {
  const auth = await getAuthUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", auth.data.user.id)
    .select("id, full_name, surname, initials, designation, role, lab, active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
