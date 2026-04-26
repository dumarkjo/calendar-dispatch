const fs = require('fs');
const { createClient } = require("@supabase/supabase-js");

const envVars = fs.readFileSync('.env.local', 'utf8').split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of envVars) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabaseAdmin.from('staff').insert({
    full_name: 'Mark John L. Dela Cruz',
    surname: 'Dela Cruz',
    initials: 'MJDC',
    designation: 'Test Engineer',
    email: 'mjcruz0319@gmail.com',
    role: 'engineer',
    active: true
  });
  console.log("Result:", error);
}
run();
