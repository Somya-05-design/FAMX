import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
