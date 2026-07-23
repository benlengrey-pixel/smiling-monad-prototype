import {
  createClient,
} from "@supabase/supabase-js";

const COMPANION_REQUEST_LIMIT =
  30;

const COMPANION_WINDOW_SECONDS =
  60;

type PersistentRateLimitRow = {
  allowed: boolean;
  retry_after_seconds: number;
  remaining_requests: number;
};

export type PersistentRateLimitErrorCode =
  | "PERSISTENT_RATE_LIMIT_EXCEEDED"
  | "PERSISTENT_RATE_LIMIT_UNAVAILABLE";

export class PersistentRateLimitError
  extends Error {
  readonly status: 429 | 503;

  readonly code:
    PersistentRateLimitErrorCode;

  readonly retryAfterSeconds:
    number | null;

  constructor({
    message,
    status,
    code,
    retryAfterSeconds = null,
  }: {
    message: string;
    status: 429 | 503;
    code:
      PersistentRateLimitErrorCode;
    retryAfterSeconds?:
      number | null;
  }) {
    super(message);

    this.name =
      "PersistentRateLimitError";

    this.status =
      status;

    this.code =
      code;

    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}

export function isPersistentRateLimitError(
  error: unknown,
): error is PersistentRateLimitError {
  return (
    error instanceof
    PersistentRateLimitError
  );
}

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

function readSupabaseConfiguration(): {
  url: string;
  publishableKey: string;
} {
  const url =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  const publishableKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  let validUrl =
    false;

  try {
    const parsed =
      new URL(url);

    validUrl =
      parsed.protocol ===
      "https:";
  } catch {
    validUrl =
      false;
  }

  if (
    !validUrl ||
    !publishableKey.startsWith(
      "sb_publishable_",
    )
  ) {
    throw new PersistentRateLimitError({
      message:
        "The Companion usage controls are temporarily unavailable.",

      status:
        503,

      code:
        "PERSISTENT_RATE_LIMIT_UNAVAILABLE",
    });
  }

  return {
    url,
    publishableKey,
  };
}

function readRateLimitRow(
  value: unknown,
): PersistentRateLimitRow | null {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  if (
    typeof candidate !==
      "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const row =
    candidate as Record<
      string,
      unknown
    >;

  if (
    typeof row.allowed !==
      "boolean" ||
    typeof row
      .retry_after_seconds !==
      "number" ||
    !Number.isFinite(
      row.retry_after_seconds,
    ) ||
    typeof row
      .remaining_requests !==
      "number" ||
    !Number.isFinite(
      row.remaining_requests,
    )
  ) {
    return null;
  }

  return {
    allowed:
      row.allowed,

    retry_after_seconds:
      Math.max(
        0,
        Math.floor(
          row.retry_after_seconds,
        ),
      ),

    remaining_requests:
      Math.max(
        0,
        Math.floor(
          row.remaining_requests,
        ),
      ),
  };
}

export async function enforcePersistentCompanionRateLimit(
  accessToken: string,
): Promise<void> {
  const cleanAccessToken =
    accessToken.trim();

  if (
    cleanAccessToken.length <
      40 ||
    cleanAccessToken.length >
      8192
  ) {
    throw new PersistentRateLimitError({
      message:
        "The Companion usage controls could not verify the current session.",

      status:
        503,

      code:
        "PERSISTENT_RATE_LIMIT_UNAVAILABLE",
    });
  }

  const {
    url,
    publishableKey,
  } =
    readSupabaseConfiguration();

  const supabase =
    createClient(
      url,
      publishableKey,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${cleanAccessToken}`,
          },
        },

        auth: {
          persistSession:
            false,

          autoRefreshToken:
            false,

          detectSessionInUrl:
            false,
        },
      },
    );

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "sm_enforce_companion_gateway_rate_limit",
      {
        p_limit:
          COMPANION_REQUEST_LIMIT,

        p_window_seconds:
          COMPANION_WINDOW_SECONDS,
      },
    );

  if (error) {
    throw new PersistentRateLimitError({
      message:
        "The Companion usage controls are temporarily unavailable.",

      status:
        503,

      code:
        "PERSISTENT_RATE_LIMIT_UNAVAILABLE",
    });
  }

  const result =
    readRateLimitRow(
      data,
    );

  if (!result) {
    throw new PersistentRateLimitError({
      message:
        "The Companion usage controls returned an invalid response.",

      status:
        503,

      code:
        "PERSISTENT_RATE_LIMIT_UNAVAILABLE",
    });
  }

  if (result.allowed) {
    return;
  }

  const retryAfterSeconds =
    Math.max(
      1,
      result.retry_after_seconds,
    );

  throw new PersistentRateLimitError({
    message:
      "Kimi has received too many requests. Please wait briefly and try again.",

    status:
      429,

    code:
      "PERSISTENT_RATE_LIMIT_EXCEEDED",

    retryAfterSeconds,
  });
}