import {
  createClient,
} from "@supabase/supabase-js";

export type CompanionGatewayAuditEventType =
  | "request_started"
  | "request_completed"
  | "request_failed"
  | "rate_limited";

export type CompanionGatewayAuditOutcome =
  | "allowed"
  | "completed"
  | "failed"
  | "blocked";

export type CompanionGatewayAuditEvent = {
  eventType:
    CompanionGatewayAuditEventType;

  outcome:
    CompanionGatewayAuditOutcome;

  statusCode?:
    number | null;

  modelName?:
    string | null;
};

export type CompanionGatewayAuditErrorCode =
  "COMPANION_AUDIT_UNAVAILABLE";

export class CompanionGatewayAuditError
  extends Error {
  readonly status = 503;

  readonly code:
    CompanionGatewayAuditErrorCode =
      "COMPANION_AUDIT_UNAVAILABLE";

  constructor() {
    super(
      "The Companion security audit service is temporarily unavailable.",
    );

    this.name =
      "CompanionGatewayAuditError";
  }
}

export function isCompanionGatewayAuditError(
  error: unknown,
): error is CompanionGatewayAuditError {
  return (
    error instanceof
    CompanionGatewayAuditError
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
    throw new CompanionGatewayAuditError();
  }

  return {
    url,
    publishableKey,
  };
}

function validateAccessToken(
  accessToken: string,
): string {
  const value =
    accessToken.trim();

  if (
    value.length < 40 ||
    value.length > 8192 ||
    value.includes(",")
  ) {
    throw new CompanionGatewayAuditError();
  }

  return value;
}

function validateStatusCode(
  value:
    | number
    | null
    | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value > 599
  ) {
    throw new CompanionGatewayAuditError();
  }

  return value;
}

function cleanModelName(
  value:
    | string
    | null
    | undefined,
): string | null {
  const clean =
    value?.trim().slice(
      0,
      120,
    ) ?? "";

  return clean || null;
}

export async function recordCompanionGatewayAuditEvent(
  accessToken: string,
  event: CompanionGatewayAuditEvent,
): Promise<void> {
  const cleanAccessToken =
    validateAccessToken(
      accessToken,
    );

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
      "sm_record_companion_gateway_event",
      {
        p_event_type:
          event.eventType,

        p_outcome:
          event.outcome,

        p_status_code:
          validateStatusCode(
            event.statusCode,
          ),

        p_model_name:
          cleanModelName(
            event.modelName,
          ),
      },
    );

  if (
    error ||
    data === null ||
    data === undefined
  ) {
    throw new CompanionGatewayAuditError();
  }
}

export async function recordCompanionGatewayAuditEventSafely(
  accessToken: string,
  event: CompanionGatewayAuditEvent,
): Promise<void> {
  try {
    await recordCompanionGatewayAuditEvent(
      accessToken,
      event,
    );
  } catch (error) {
    console.error(
      "Companion audit recording failed:",
      error instanceof Error
        ? error.message
        : "Unknown audit error",
    );
  }
}