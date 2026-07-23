import {
  enforceApiRateLimit as enforceBaseApiRateLimit,
} from "./api-request-security";
import {
  requireVerifiedApiUserId,
} from "./verified-api-user";

export {
  ApiRequestSecurityError,
  apiSecurityErrorResponse,
  assertTrustedRequestOrigin,
  privateApiJson,
  readSecureJsonBody,
} from "./api-request-security";

type AuthenticatedRateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
  identity?: string;
};

export function enforceApiRateLimit(
  request: Request,
  options: AuthenticatedRateLimitOptions,
): void {
  const identity =
    options.namespace ===
    "companion-gateway"
      ? `user:${requireVerifiedApiUserId(
          request,
        )}`
      : options.identity;

  enforceBaseApiRateLimit(
    request,
    {
      ...options,
      identity,
    },
  );
}