import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const MAX_AUTHORIZATION_HEADER_LENGTH =
  8_192;

const MIN_ACCESS_TOKEN_LENGTH = 40;

export type ApiAuthenticationErrorCode =
  | "AUTH_CONFIGURATION_MISSING"
  | "AUTHORIZATION_MISSING"
  | "AUTHORIZATION_INVALID"
  | "SESSION_INVALID";

export type AuthenticatedApiUser = {
  user: User;
  accessToken: string;
  authenticationMethod: "bearer";
};

export class ApiAuthenticationError
  extends Error {
  readonly status: 401 | 503;
  readonly code:
    ApiAuthenticationErrorCode;

  constructor({
    message,
    status,
    code,
  }: {
    message: string;
    status: 401 | 503;
    code:
      ApiAuthenticationErrorCode;
  }) {
    super(message);

    this.name =
      "ApiAuthenticationError";

    this.status = status;
    this.code = code;
  }
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

function readProjectReference(
  value: string,
): string {
  try {
    const hostname =
      new URL(value).hostname;

    return (
      hostname.split(".")[0]
        ?.trim() || "unknown"
    );
  } catch {
    return "unknown";
  }
}

function readTokenIssuer(
  accessToken: string,
): string {
  try {
    const encodedPayload =
      accessToken.split(".")[1];

    if (!encodedPayload) {
      return "";
    }

    const base64 =
      encodedPayload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(
          Math.ceil(
            encodedPayload.length / 4,
          ) * 4,
          "=",
        );

    const binary =
      globalThis.atob(base64);

    const bytes =
      Uint8Array.from(
        binary,
        (character) =>
          character.charCodeAt(0),
      );

    const payload =
      JSON.parse(
        new TextDecoder().decode(
          bytes,
        ),
      ) as {
        iss?: unknown;
      };

    return typeof payload.iss ===
      "string"
      ? payload.iss.trim()
      : "";
  } catch {
    return "";
  }
}

function reportVerificationFailure({
  accessToken,
  error,
}: {
  accessToken: string;
  error: Error | null;
}): void {
  if (
    process.env.NODE_ENV !==
    "development"
  ) {
    return;
  }

  const configuredUrl =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  const tokenIssuer =
    readTokenIssuer(
      accessToken,
    );

  const configuredProject =
    readProjectReference(
      configuredUrl,
    );

  const tokenProject =
    readProjectReference(
      tokenIssuer,
    );

  console.error(
    "Supabase session verification failed:",
    {
      configuredProject,
      tokenProject,
      projectsMatch:
        configuredProject !==
          "unknown" &&
        configuredProject ===
          tokenProject,
      reason:
        error?.message ??
        "No verified claims were returned.",
    },
  );
}

function readSupabaseConfiguration(): {
  url: string;
  publishableKey: string;
} {
  const rawUrl =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  const publishableKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );

  let url = "";

  try {
    const parsed =
      new URL(rawUrl);

    if (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    ) {
      url =
        parsed.origin;
    }
  } catch {
    url = "";
  }

  if (
    !url ||
    !publishableKey.startsWith(
      "sb_publishable_",
    )
  ) {
    throw new ApiAuthenticationError({
      message:
        "Application authentication is temporarily unavailable.",
      status: 503,
      code:
        "AUTH_CONFIGURATION_MISSING",
    });
  }

  return {
    url,
    publishableKey,
  };
}

function createAuthenticationClient():
  SupabaseClient {
  const {
    url,
    publishableKey,
  } = readSupabaseConfiguration();

  return createClient(
    url,
    publishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function readBearerToken(
  request: Request,
): string {
  const authorization =
    request.headers
      .get("authorization")
      ?.trim() ?? "";

  if (!authorization) {
    throw new ApiAuthenticationError({
      message:
        "Please sign in to use the Companion.",
      status: 401,
      code:
        "AUTHORIZATION_MISSING",
    });
  }

  if (
    authorization.length >
    MAX_AUTHORIZATION_HEADER_LENGTH
  ) {
    throw new ApiAuthenticationError({
      message:
        "The sign-in session is not valid.",
      status: 401,
      code:
        "AUTHORIZATION_INVALID",
    });
  }

  const match =
    authorization.match(
      /^Bearer\s+(\S+)$/i,
    );

  const accessToken =
    match?.[1]?.trim() ?? "";

  if (
    accessToken.length <
      MIN_ACCESS_TOKEN_LENGTH ||
    accessToken.length >
      MAX_AUTHORIZATION_HEADER_LENGTH ||
    accessToken.includes(",")
  ) {
    throw new ApiAuthenticationError({
      message:
        "The sign-in session is not valid.",
      status: 401,
      code:
        "AUTHORIZATION_INVALID",
    });
  }

  return accessToken;
}

function claimsToUser(
  claims: {
    sub: string;
    aud: string | string[];
    iat: number;
    role: string;
    email?: string;
    phone?: string;
    app_metadata?: User["app_metadata"];
    user_metadata?: User["user_metadata"];
    is_anonymous?: boolean;
  },
): User {
  const audience =
    Array.isArray(claims.aud)
      ? claims.aud[0] ??
        "authenticated"
      : claims.aud;

  return {
    id:
      claims.sub,

    app_metadata:
      claims.app_metadata ?? {},

    user_metadata:
      claims.user_metadata ?? {},

    aud:
      audience,

    created_at:
      new Date(
        claims.iat * 1000,
      ).toISOString(),

    email:
      claims.email,

    phone:
      claims.phone,

    role:
      claims.role,

    is_anonymous:
      claims.is_anonymous,
  };
}

export function isApiAuthenticationError(
  error: unknown,
): error is ApiAuthenticationError {
  return (
    error instanceof
    ApiAuthenticationError
  );
}

export async function requireAuthenticatedApiUser(
  request: Request,
): Promise<AuthenticatedApiUser> {
  const accessToken =
    readBearerToken(request);

  const supabase =
    createAuthenticationClient();

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims(
      accessToken,
    );

  const subject =
    data?.claims.sub
      ?.trim() ?? "";

  if (
    error ||
    !data ||
    !subject
  ) {
    reportVerificationFailure({
      accessToken,
      error,
    });

    throw new ApiAuthenticationError({
      message:
        "Your session has expired. Please sign in again.",
      status: 401,
      code:
        "SESSION_INVALID",
    });
  }

  return {
    user:
      claimsToUser({
        ...data.claims,
        sub: subject,
      }),

    accessToken,

    authenticationMethod:
      "bearer",
  };
}