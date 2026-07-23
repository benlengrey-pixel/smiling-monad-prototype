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
  readSecureJsonBody,
} from "./api-request-security";

import {
  isVerifiedApiUserError,
  requireVerifiedApiUserId,
} from "./verified-api-user";

export {
  ApiRequestSecurityError,
  assertTrustedRequestOrigin,
  privateApiJson,
  readSecureJsonBody,
};

type AuthenticatedRateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
  identity?: string;
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