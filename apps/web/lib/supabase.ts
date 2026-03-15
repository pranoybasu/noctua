import { createClient } from "@supabase/supabase-js";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "placeholder";

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
);

export function createBrowserClient() {
  if (DEMO_MODE) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? supabaseUrl,
    supabaseAnonKey,
    {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    }
  );
}
