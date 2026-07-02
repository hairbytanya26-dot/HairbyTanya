import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and bypasses Row Level Security.
// It must only ever be imported in server-only code (API routes / route handlers),
// never in a Client Component, and the key must never be prefixed with NEXT_PUBLIC_.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
