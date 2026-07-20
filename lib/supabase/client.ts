import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let browserClient: SupabaseClient | null =
  null;

function cleanEnvironmentValue(
  value: string | undefined,
): string {
  if (!value) {
    return "";
  }

  let cleaned = value.trim();

  const equalsPosition =
    cleaned.indexOf("=");

  if (
    equalsPosition >= 0 &&
    cleaned
      .slice(0, equalsPosition)
      .includes("SUPABASE")
  ) {
    cleaned = cleaned
      .slice(equalsPosition + 1)
      .trim();
  }

  cleaned = cleaned.replace(
    /^["'`]+|["'`]+$/g,
    "",
  );

  return cleaned.trim();
}

function readSupabaseUrl(): string {
  const rawValue =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  const urlMatch = rawValue.match(
    /https:\/\/[a-zA-Z0-9-]+\.supabase\.co/,
  );

  const supabaseUrl =
    urlMatch?.[0] ?? rawValue;

  try {
    const parsedUrl =
      new URL(supabaseUrl);

    if (
      parsedUrl.protocol !== "https:" ||
      !parsedUrl.hostname.endsWith(
        ".supabase.co",
      )
    ) {
      throw new Error(
        "Invalid Supabase host.",
      );
    }

    return parsedUrl.origin;
  } catch {
    throw new Error(
      "The Supabase URL could not be read. Check NEXT_PUBLIC_SUPABASE_URL in Vercel.",
    );
  }
}

function readPublishableKey(): string {
  const publishableKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  if (!publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.",
    );
  }

  return publishableKey;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(
    readSupabaseUrl(),
    readPublishableKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  return browserClient;
}