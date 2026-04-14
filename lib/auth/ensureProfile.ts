import { supabaseAdmin } from "@/lib/supabase/admin";

export async function ensureProfile(user: { id: string; email?: string | null }) {
  const supabase = supabaseAdmin;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) return;

  await supabase.from("profiles").insert({
    id: user.id,
    full_name: user.email ?? "New User",
    role: "staff", // default role for now
  });
}