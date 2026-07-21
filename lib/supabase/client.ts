import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL =
  "https://kosfujyebwsmdvbolhur.supabase.co";

let browserClient:
  | SupabaseClient
  | undefined;

function cleanEnvironmentValue(
  value: string | undefined,
): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function getValidSupabaseUrl(
  value: string | undefined,
): string {
  const cleanedValue =
    cleanEnvironmentValue(value);

  try {
    const parsedUrl = new URL(cleanedValue);

    if (
      parsedUrl.protocol === "https:" ||
      parsedUrl.protocol === "http:"
    ) {
      return cleanedValue;
    }
  } catch {
    // Use the known project URL below.
  }

  return FALLBACK_SUPABASE_URL;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const supabaseUrl =
    getValidSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );

  const supabasePublishableKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing Supabase publishable key.",
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