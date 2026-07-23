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

  let validUrl = false;

  try {
    const parsed = new URL(url);

    validUrl =
      parsed.protocol === "https:";
  } catch {
    validUrl = false;
  }

  if (
    !validUrl ||
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
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    );

  if (
    error ||
    !user
  ) {
    throw new ApiAuthenticationError({
      message:
        "Your session has expired. Please sign in again.",
      status: 401,
      code:
        "SESSION_INVALID",
    });
  }

  return {
    user,
    accessToken,
    authenticationMethod:
      "bearer",
  };
}