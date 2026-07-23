import type {
  NextResponse,
} from "next/server";

import {
  ApiRequestSecurityError,
  apiSecurityErrorResponse
    as baseApiSecurityErrorResponse,
  assertTrustedRequestOrigin,
  enforceApiRateLimit
    as enforceBaseApiRateLimit,
  privateApiJson,
  readSecureJsonBody
    as readBaseSecureJsonBody,
} from "./api-request-security";

import {
  isApiAuthenticationError,
  requireAuthenticatedApiUser,
} from "./api-user-auth";

import {
  enforcePersistentCompanionRateLimit,
  isPersistentRateLimitError,
} from "./persistent-companion-rate-limit";

import {
  isVerifiedApiUserError,
  requireVerifiedApiUserId,
  VerifiedApiUserError,
} from "./verified-api-user";

export {
  ApiRequestSecurityError,
  assertTrustedRequestOrigin,
  privateApiJson,
};

type AuthenticatedRateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
  identity?: string;
};

type SecureJsonOptions = {
  maximumBytes?: number;
  requireSameOrigin?: boolean;
};

export function apiSecurityErrorResponse(
  error: unknown,
): NextResponse | null {
  const baseResponse =
    baseApiSecurityErrorResponse(
      error,
    );

  if (baseResponse) {
    return baseResponse;
  }

  if (
    isApiAuthenticationError(
      error,
    )
  ) {
    return privateApiJson(
      {
        error:
          error.message,

        code:
          error.code,
      },
      error.status,
    );
  }

  if (
    isVerifiedApiUserError(
      error,
    )
  ) {
    return privateApiJson(
      {
        error:
          error.message,

        code:
          error.code,
      },
      error.status,
    );
  }

  if (
    isPersistentRateLimitError(
      error,
    )
  ) {
    const response =
      privateApiJson(
        {
          error:
            error.message,

          code:
            error.code,
        },
        error.status,
      );

    if (
      error.retryAfterSeconds
    ) {
      response.headers.set(
        "Retry-After",
        String(
          error.retryAfterSeconds,
        ),
      );
    }

    return response;
  }

  return null;
}

export function enforceApiRateLimit(
  request: Request,
  options:
    AuthenticatedRateLimitOptions,
): void {
  let identity =
    options.identity;

  if (
    options.namespace ===
    "companion-gateway"
  ) {
    identity =
      `user:${requireVerifiedApiUserId(
        request,
      )}`;
  }

  enforceBaseApiRateLimit(
    request,
    {
      ...options,
      identity,
    },
  );
}

export async function readSecureJsonBody<
  Value,
>(
  request: Request,
  options: SecureJsonOptions = {},
): Promise<Value> {
  const authenticated =
    await requireAuthenticatedApiUser(
      request,
    );

  const verifiedUserId =
    requireVerifiedApiUserId(
      request,
    );

  if (
    authenticated.user.id !==
    verifiedUserId
  ) {
    throw new VerifiedApiUserError();
  }

  await enforcePersistentCompanionRateLimit(
    authenticated.accessToken,
  );

  return readBaseSecureJsonBody<Value>(
    request,
    options,
  );
}