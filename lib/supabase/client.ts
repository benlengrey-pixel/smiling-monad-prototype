import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let browserClient:
  | SupabaseClient
  | undefined;

function cleanEnvironmentValue(
  value: string | undefined,
): string {
  return (
    value
      ?.trim()
      .replace(
        /^["']|["']$/g,
        "",
      )
      .trim() ?? ""
  );
}

function readSupabaseUrl(): string {
  const value =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  try {
    const parsed =
      new URL(value);

    const localDevelopmentUrl =
      process.env.NODE_ENV ===
        "development" &&
      (
        parsed.hostname ===
          "localhost" ||
        parsed.hostname ===
          "127.0.0.1"
      ) &&
      parsed.protocol ===
        "http:";

    const secureUrl =
      parsed.protocol ===
      "https:";

    if (
      (
        secureUrl ||
        localDevelopmentUrl
      ) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    ) {
      return parsed.origin;
    }
  } catch {
    // Configuration error handled below.
  }

  throw new Error(
    "Supabase is not configured correctly. Check NEXT_PUBLIC_SUPABASE_URL.",
  );
}

function readSupabasePublishableKey():
  string {
  const value =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  if (
    value.startsWith(
      "sb_publishable_",
    ) &&
    value.length >= 30 &&
    value.length <= 512
  ) {
    return value;
  }

  throw new Error(
    "Supabase is not configured correctly. Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export function getSupabaseBrowserClient():
  SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient =
    createClient(
      readSupabaseUrl(),
      readSupabasePublishableKey(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,

          experimental: {
            passkey: true,
          },
        },
      },
    );

  return browserClient;
}