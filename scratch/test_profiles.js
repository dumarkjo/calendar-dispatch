const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Users:", users.users.map(u => ({ id: u.id, email: u.email })));
  const { data: profiles, error: profErr } = await supabaseAdmin.from("profiles").select("*");
  console.log("Profiles:", profiles);
  const { data: assignments, error: assErr } = await supabaseAdmin.from("dispatch_assignments").select("*");
  console.log("Assignments:", assignments);
}
run();
