import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  isApiAuthenticationError,
  requireAuthenticatedApiUser,
} from "@/lib/security/api-user-auth";

const AUTHENTICATED_USER_HEADER =
  "x-smiling-monad-auth-user";

type ProtectedApiAuthentication = {
  response: NextResponse | null;
  userId: string | null;
};

function cleanOrigin(
  value: string | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    return new URL(
      value.trim(),
    ).origin;
  } catch {
    return null;
  }
}

function websocketOrigin(
  origin: string | null,
): string | null {
  if (!origin) {
    return null;
  }

  return origin.replace(
    /^http/i,
    "ws",
  );
}

function buildContentSecurityPolicy():
  string {
  const isDevelopment =
    process.env.NODE_ENV ===
    "development";

  const supabaseOrigin =
    cleanOrigin(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
    );

  const supabaseWebsocketOrigin =
    websocketOrigin(
      supabaseOrigin,
    );

  const connectSources = [
    "'self'",
    supabaseOrigin,
    supabaseWebsocketOrigin,
    isDevelopment
      ? "ws://localhost:*"
      : null,
    isDevelopment
      ? "http://localhost:*"
      : null,
  ].filter(Boolean);

  const directives = [
    "default-src 'self'",

    `script-src 'self' 'unsafe-inline'${
      isDevelopment
        ? " 'unsafe-eval'"
        : ""
    }`,

    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",

    `connect-src ${connectSources.join(
      " ",
    )}`,

    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self'",

    isDevelopment
      ? null
      : "upgrade-insecure-requests",
  ].filter(Boolean);

  return directives.join("; ");
}

function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(),
  );

  response.headers.set(
    "X-Content-Type-Options",
    "nosniff",
  );

  response.headers.set(
    "X-Frame-Options",
    "DENY",
  );

  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "microphone=(self)",
      "payment=()",
      "publickey-credentials-get=(self)",
      "usb=()",
      "browsing-topics=()",
    ].join(", "),
  );

  response.headers.set(
    "Cross-Origin-Opener-Policy",
    "same-origin",
  );

  response.headers.set(
    "Cross-Origin-Resource-Policy",
    "same-origin",
  );

  response.headers.set(
    "Origin-Agent-Cluster",
    "?1",
  );

  response.headers.set(
    "X-DNS-Prefetch-Control",
    "off",
  );

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  response.headers.set(
    "Cache-Control",
    request.nextUrl.pathname.startsWith(
      "/api/",
    )
      ? "no-store"
      : response.headers.get(
          "Cache-Control",
        ) ?? "private",
  );

  return response;
}

function isCompanionGatewayRequest(
  request: NextRequest,
): boolean {
  const pathname =
    request.nextUrl.pathname;

  return (
    request.method !== "OPTIONS" &&
    (
      pathname === "/api/gateway" ||
      pathname === "/api/gateway/"
    )
  );
}

async function authenticateProtectedApi(
  request: NextRequest,
): Promise<ProtectedApiAuthentication> {
  if (
    !isCompanionGatewayRequest(
      request,
    )
  ) {
    return {
      response: null,
      userId: null,
    };
  }

  try {
    const authenticated =
      await requireAuthenticatedApiUser(
        request,
      );

    return {
      response: null,
      userId:
        authenticated.user.id,
    };
  } catch (error) {
    if (
      isApiAuthenticationError(
        error,
      )
    ) {
      return {
        response:
          applySecurityHeaders(
            NextResponse.json(
              {
                error:
                  error.message,

                code:
                  error.code,
              },
              {
                status:
                  error.status,
              },
            ),
            request,
          ),

        userId: null,
      };
    }

    console.error(
      "Protected API authentication error:",
      error,
    );

    return {
      response:
        applySecurityHeaders(
          NextResponse.json(
            {
              error:
                "Application authentication is temporarily unavailable.",
            },
            {
              status: 503,
            },
          ),
          request,
        ),

      userId: null,
    };
  }
}

export async function proxy(
  request: NextRequest,
) {
  const forwardedHeaders =
    new Headers(
      request.headers,
    );

  /*
   * Never trust a value supplied by
   * the browser for this internal
   * identity header.
   */
  forwardedHeaders.delete(
    AUTHENTICATED_USER_HEADER,
  );

  const authentication =
    await authenticateProtectedApi(
      request,
    );

  if (
    authentication.response
  ) {
    return authentication.response;
  }

  if (
    authentication.userId
  ) {
    forwardedHeaders.set(
      AUTHENTICATED_USER_HEADER,
      authentication.userId,
    );
  }

  const response =
    NextResponse.next({
      request: {
        headers:
          forwardedHeaders,
      },
    });

  return applySecurityHeaders(
    response,
    request,
  );
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",

      missing: [
        {
          type: "header",
          key:
            "next-router-prefetch",
        },
        {
          type: "header",
          key: "purpose",
          value: "prefetch",
        },
      ],
    },
  ],
};