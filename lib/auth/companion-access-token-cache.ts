import type {
  Session,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

const TOKEN_EXPIRY_BUFFER_MS =
  15_000;

const FALLBACK_CACHE_LIFETIME_MS =
  30_000;

let cachedAccessToken =
  "";

let cachedExpiryTime =
  0;

let sessionRequest:
  Promise<string> | null =
  null;

let authListenerStarted =
  false;

function clearCachedSession():
  void {
  cachedAccessToken =
    "";

  cachedExpiryTime =
    0;
}

function readSessionExpiryTime(
  session: Session,
): number {
  if (
    typeof session.expires_at ===
      "number" &&
    Number.isFinite(
      session.expires_at,
    )
  ) {
    return (
      session.expires_at *
      1000
    );
  }

  return (
    Date.now() +
    FALLBACK_CACHE_LIFETIME_MS
  );
}

function cacheSession(
  session: Session | null,
): string {
  if (!session) {
    clearCachedSession();

    return "";
  }

  const accessToken =
    session.access_token
      ?.trim() ?? "";

  if (!accessToken) {
    clearCachedSession();

    return "";
  }

  cachedAccessToken =
    accessToken;

  cachedExpiryTime =
    readSessionExpiryTime(
      session,
    );

  return accessToken;
}

function hasUsableCachedToken():
  boolean {
  return Boolean(
    cachedAccessToken &&
    cachedExpiryTime -
      Date.now() >
      TOKEN_EXPIRY_BUFFER_MS,
  );
}

function startAuthListener():
  void {
  if (authListenerStarted) {
    return;
  }

  authListenerStarted =
    true;

  const supabase =
    getSupabaseBrowserClient();

  supabase.auth.onAuthStateChange(
    (
      event,
      session,
    ) => {
      if (
        event ===
        "SIGNED_OUT"
      ) {
        clearCachedSession();

        return;
      }

      cacheSession(
        session,
      );
    },
  );
}

export function clearCompanionAccessTokenCache():
  void {
  clearCachedSession();
}

export async function readCompanionAccessToken():
  Promise<string> {
  startAuthListener();

  if (
    hasUsableCachedToken()
  ) {
    return cachedAccessToken;
  }

  if (sessionRequest) {
    return sessionRequest;
  }

  sessionRequest =
    (async () => {
      const supabase =
        getSupabaseBrowserClient();

      const {
        data: {
          session,
        },
        error,
      } =
        await supabase.auth
          .getSession();

      if (error) {
        clearCachedSession();

        throw new Error(
          "Your sign-in session could not be checked.",
        );
      }

      const accessToken =
        cacheSession(
          session,
        );

      if (!accessToken) {
        throw new Error(
          "Please sign in before using Kimi.",
        );
      }

      return accessToken;
    })();

  try {
    return await sessionRequest;
  } finally {
    sessionRequest =
      null;
  }
}