import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL =
  "https://kosfujyebwsmdvbolhur.supabase.co";

const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_-c6GF8W9T-GzvTPgpxwytw_U6LLw1iK";

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
    // Use the known project URL.
  }

  return FALLBACK_SUPABASE_URL;
}

function getValidPublishableKey(
  value: string | undefined,
): string {
  const cleanedValue =
    cleanEnvironmentValue(value);

  if (
    cleanedValue.startsWith(
      "sb_publishable_",
    )
  ) {
    return cleanedValue;
  }

  return FALLBACK_SUPABASE_PUBLISHABLE_KEY;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const supabaseUrl =
    getValidSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );

  const supabasePublishableKey =
    getValidPublishableKey(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
    );
  }

  return browserClient;
}