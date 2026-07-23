import {
  NextResponse,
} from "next/server";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
  identity?: string;
};

type SecureJsonOptions = {
  maximumBytes?: number;
  requireSameOrigin?: boolean;
};

type SecurityErrorCode =
  | "invalid_content_type"
  | "invalid_json"
  | "missing_origin"
  | "payload_too_large"
  | "rate_limited"
  | "untrusted_origin";

declare global {
  var __smilingMonadRateLimits:
    | Map<string, RateLimitRecord>
    | undefined;
}

const rateLimitStore =
  globalThis.__smilingMonadRateLimits ??
  new Map<string, RateLimitRecord>();

globalThis.__smilingMonadRateLimits =
  rateLimitStore;

export class ApiRequestSecurityError extends Error {
  readonly code: SecurityErrorCode;
  readonly status: number;
  readonly retryAfterSeconds:
    | number
    | null;

  constructor(
    code: SecurityErrorCode,
    message: string,
    status: number,
    retryAfterSeconds:
      | number
      | null = null,
  ) {
    super(message);

    this.name =
      "ApiRequestSecurityError";

    this.code = code;
    this.status = status;
    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}

function normaliseOrigin(
  value:
    | string
    | null
    | undefined,
): string | null {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  const candidate =
    /^[a-z][a-z0-9+.-]*:\/\//i.test(
      clean,
    )
      ? clean
      : `https://${clean}`;

  try {
    return new URL(
      candidate,
    ).origin;
  } catch {
    return null;
  }
}

function forwardedRequestOrigin(
  request: Request,
): string | null {
  const forwardedHost =
    request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();

  const host =
    forwardedHost ||
    request.headers
      .get("host")
      ?.trim();

  if (!host) {
    return null;
  }

  const forwardedProtocol =
    request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();

  const protocol =
    forwardedProtocol ||
    new URL(request.url)
      .protocol
      .replace(":", "");

  return normaliseOrigin(
    `${protocol}://${host}`,
  );
}

function trustedOrigins(
  request: Request,
): Set<string> {
  const origins =
    new Set<string>();

  const candidates = [
    new URL(request.url).origin,
    forwardedRequestOrigin(
      request,
    ),
    normaliseOrigin(
      process.env.NEXT_PUBLIC_APP_URL,
    ),
    normaliseOrigin(
      process.env.APP_URL,
    ),
    normaliseOrigin(
      process.env.VERCEL_URL,
    ),
  ];

  for (
    const candidate of candidates
  ) {
    if (candidate) {
      origins.add(candidate);
    }
  }

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    origins.add(
      "http://localhost:3000",
    );

    origins.add(
      "http://127.0.0.1:3000",
    );
  }

  return origins;
}

function requestIdentity(
  request: Request,
): string {
  const forwardedFor =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  const realIp =
    request.headers
      .get("x-real-ip")
      ?.trim();

  const userAgent =
    request.headers
      .get("user-agent")
      ?.slice(0, 160)
      .trim();

  return [
    forwardedFor ||
      realIp ||
      "unknown-ip",
    userAgent ||
      "unknown-agent",
  ].join("|");
}

function removeExpiredRateLimits(
  now: number,
): void {
  if (
    rateLimitStore.size < 2000
  ) {
    return;
  }

  for (
    const [
      key,
      record,
    ] of rateLimitStore
  ) {
    if (
      record.resetAt <= now
    ) {
      rateLimitStore.delete(key);
    }
  }
}

export function assertTrustedRequestOrigin(
  request: Request,
  requireOrigin = true,
): void {
  const fetchSite =
    request.headers
      .get("sec-fetch-site")
      ?.toLowerCase();

  if (
    fetchSite === "cross-site"
  ) {
    throw new ApiRequestSecurityError(
      "untrusted_origin",
      "This request origin is not allowed.",
      403,
    );
  }

  const originHeader =
    request.headers.get("origin");

  if (!originHeader) {
    if (
      requireOrigin &&
      process.env.NODE_ENV ===
        "production"
    ) {
      throw new ApiRequestSecurityError(
        "missing_origin",
        "A trusted request origin is required.",
        403,
      );
    }

    return;
  }

  const cleanOrigin =
    normaliseOrigin(
      originHeader,
    );

  if (
    !cleanOrigin ||
    !trustedOrigins(
      request,
    ).has(cleanOrigin)
  ) {
    throw new ApiRequestSecurityError(
      "untrusted_origin",
      "This request origin is not allowed.",
      403,
    );
  }
}

export function enforceApiRateLimit(
  request: Request,
  {
    namespace,
    limit,
    windowMs,
    identity,
  }: RateLimitOptions,
): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1
  ) {
    throw new Error(
      "Rate limit must be a positive integer.",
    );
  }

  if (
    !Number.isFinite(windowMs) ||
    windowMs < 1000
  ) {
    throw new Error(
      "Rate limit window must be at least one second.",
    );
  }

  const now = Date.now();

  removeExpiredRateLimits(now);

  const key = [
    namespace.trim() ||
      "api",
    identity?.trim() ||
      requestIdentity(
        request,
      ),
  ].join(":");

  const current =
    rateLimitStore.get(key);

  if (
    !current ||
    current.resetAt <= now
  ) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt:
        now + windowMs,
    });

    return;
  }

  if (
    current.count >= limit
  ) {
    const retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            current.resetAt -
            now
          ) / 1000,
        ),
      );

    throw new ApiRequestSecurityError(
      "rate_limited",
      "Too many requests. Please wait and try again.",
      429,
      retryAfterSeconds,
    );
  }

  current.count += 1;

  rateLimitStore.set(
    key,
    current,
  );
}

export async function readSecureJsonBody<
  Value,
>(
  request: Request,
  {
    maximumBytes = 64 * 1024,
    requireSameOrigin = true,
  }: SecureJsonOptions = {},
): Promise<Value> {
  assertTrustedRequestOrigin(
    request,
    requireSameOrigin,
  );

  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  if (
    !contentType.startsWith(
      "application/json",
    )
  ) {
    throw new ApiRequestSecurityError(
      "invalid_content_type",
      "Content-Type must be application/json.",
      415,
    );
  }

  const contentLength =
    Number(
      request.headers.get(
        "content-length",
      ),
    );

  if (
    Number.isFinite(
      contentLength,
    ) &&
    contentLength >
      maximumBytes
  ) {
    throw new ApiRequestSecurityError(
      "payload_too_large",
      "The request is too large.",
      413,
    );
  }

  const rawBody =
    await request.text();

  const actualBytes =
    new TextEncoder()
      .encode(rawBody)
      .byteLength;

  if (
    actualBytes >
    maximumBytes
  ) {
    throw new ApiRequestSecurityError(
      "payload_too_large",
      "The request is too large.",
      413,
    );
  }

  if (!rawBody.trim()) {
    throw new ApiRequestSecurityError(
      "invalid_json",
      "A JSON request body is required.",
      400,
    );
  }

  try {
    return JSON.parse(
      rawBody,
    ) as Value;
  } catch {
    throw new ApiRequestSecurityError(
      "invalid_json",
      "The request body is not valid JSON.",
      400,
    );
  }
}

export function apiSecurityErrorResponse(
  error: unknown,
): NextResponse | null {
  if (
    !(
      error instanceof
      ApiRequestSecurityError
    )
  ) {
    return null;
  }

  const headers =
    new Headers({
      "Cache-Control":
        "no-store",
    });

  if (
    error.retryAfterSeconds
  ) {
    headers.set(
      "Retry-After",
      String(
        error.retryAfterSeconds,
      ),
    );
  }

  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
    },
    {
      status: error.status,
      headers,
    },
  );
}

export function privateApiJson(
  body: unknown,
  status = 200,
): NextResponse {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
        Pragma: "no-cache",
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}