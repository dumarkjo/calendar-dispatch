import { createBrowserClient } from "@supabase/ssr";

// Creates a Supabase client that stores the session in COOKIES (not localStorage),
// so Next.js middleware can read and refresh the session on the server side.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );