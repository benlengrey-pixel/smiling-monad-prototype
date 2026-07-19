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

  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function normaliseSupabaseUrl(
  value: string | undefined,
): string {
  let cleaned =
    cleanEnvironmentValue(value);

  cleaned = cleaned.replace(
    /^NEXT_PUBLIC_SUPABASE_URL\s*=\s*/i,
    "",
  );

  if (cleaned.startsWith("//")) {
    cleaned = `https:${cleaned}`;
  }

  if (
    !cleaned.startsWith("http://") &&
    !cleaned.startsWith("https://")
  ) {
    if (
      /^[a-z0-9]{15,30}$/i.test(cleaned)
    ) {
      cleaned =
        `https://${cleaned}.supabase.co`;
    } else if (
      cleaned.endsWith(".supabase.co")
    ) {
      cleaned = `https://${cleaned}`;
    }
  }

  return cleaned;
}

function validateSupabaseUrl(
  value: string,
): string {
  try {
    const parsedUrl = new URL(value);

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.protocol !== "http:"
    ) {
      throw new Error(
        "Unsupported URL protocol.",
      );
    }

    return parsedUrl.toString();
  } catch {
    throw new Error(
      "The Supabase URL could not be read. Check NEXT_PUBLIC_SUPABASE_URL in .env.local.",
    );
  }
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const suppliedUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const suppliedKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const normalisedUrl =
    normaliseSupabaseUrl(suppliedUrl);

  const publishableKey =
    cleanEnvironmentValue(
      suppliedKey,
    ).replace(
      /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\s*=\s*/i,
      "",
    );

  if (!normalisedUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.",
    );
  }

  if (!publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing from .env.local.",
    );
  }

  const supabaseUrl =
    validateSupabaseUrl(
      normalisedUrl,
    );

  browserClient = createClient(
    supabaseUrl,
    publishableKey,
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