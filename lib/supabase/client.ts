import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let browserClient:
  | SupabaseClient
  | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    throw new Error(
      "Missing Supabase environment variables.",
    );
  }

  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
    );
  }

  return browserClient;
}