"use client";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

const IDLE_TIMEOUT_MS =
  30 * 60 * 1000;

const ABSOLUTE_SESSION_TIMEOUT_MS =
  12 * 60 * 60 * 1000;

const SESSION_CHECK_INTERVAL_MS =
  30 * 1000;

const ACTIVITY_WRITE_INTERVAL_MS =
  15 * 1000;

const STORAGE_PREFIX =
  "smiling-monad.session-security";

export type SessionExpiryReason =
  | "inactive"
  | "maximum-duration";

type SessionSecurityMonitorOptions = {
  supabase: SupabaseClient;
  userId: string;
  signedInAt?: string | null;
  onExpired: (
    reason: SessionExpiryReason,
  ) => void;
};

type StoredSessionState = {
  sessionStartedAt: number;
  lastActivityAt: number;
};

function storageKey(
  userId: string,
  field:
    | "started-at"
    | "last-activity",
): string {
  return [
    STORAGE_PREFIX,
    userId,
    field,
  ].join(".");
}

function parseTimestamp(
  value:
    | string
    | null
    | undefined,
): number | null {
  if (!value?.trim()) {
    return null;
  }

  const timestamp =
    Date.parse(value);

  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  ) {
    return null;
  }

  return timestamp;
}

function readStoredTimestamp(
  key: string,
): number | null {
  try {
    const rawValue =
      window.localStorage
        .getItem(key);

    if (!rawValue) {
      return null;
    }

    const value =
      Number(rawValue);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function writeStoredTimestamp(
  key: string,
  value: number,
): void {
  try {
    window.localStorage.setItem(
      key,
      String(value),
    );
  } catch {
    // The in-memory state still protects
    // the current browser tab.
  }
}

function removeStoredTimestamp(
  key: string,
): void {
  try {
    window.localStorage.removeItem(
      key,
    );
  } catch {
    // Nothing further is required.
  }
}

function initialiseSessionState(
  userId: string,
  signedInAt:
    | string
    | null
    | undefined,
): StoredSessionState {
  const now =
    Date.now();

  const suppliedSessionStart =
    parseTimestamp(
      signedInAt,
    );

  const storedSessionStart =
    readStoredTimestamp(
      storageKey(
        userId,
        "started-at",
      ),
    );

  const sameSession =
    suppliedSessionStart !==
      null &&
    storedSessionStart !==
      null &&
    Math.abs(
      suppliedSessionStart -
        storedSessionStart,
    ) < 60_000;

  const sessionStartedAt =
    suppliedSessionStart ??
    storedSessionStart ??
    now;

  const storedLastActivity =
    sameSession ||
    suppliedSessionStart === null
      ? readStoredTimestamp(
          storageKey(
            userId,
            "last-activity",
          ),
        )
      : null;

  const lastActivityAt =
    storedLastActivity ??
    now;

  writeStoredTimestamp(
    storageKey(
      userId,
      "started-at",
    ),
    sessionStartedAt,
  );

  writeStoredTimestamp(
    storageKey(
      userId,
      "last-activity",
    ),
    lastActivityAt,
  );

  return {
    sessionStartedAt,
    lastActivityAt,
  };
}

export function clearSessionSecurityState(
  userId: string,
): void {
  removeStoredTimestamp(
    storageKey(
      userId,
      "started-at",
    ),
  );

  removeStoredTimestamp(
    storageKey(
      userId,
      "last-activity",
    ),
  );
}

export function startSessionSecurityMonitor({
  supabase,
  userId,
  signedInAt,
  onExpired,
}: SessionSecurityMonitorOptions): () => void {
  const cleanUserId =
    userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "A signed-in user is required for session monitoring.",
    );
  }

  let active =
    true;

  let expiring =
    false;

  let lastActivityWriteAt =
    0;

  const state =
    initialiseSessionState(
      cleanUserId,
      signedInAt,
    );

  function recordActivity(): void {
    if (
      !active ||
      expiring
    ) {
      return;
    }

    const now =
      Date.now();

    state.lastActivityAt =
      now;

    if (
      now -
        lastActivityWriteAt <
      ACTIVITY_WRITE_INTERVAL_MS
    ) {
      return;
    }

    lastActivityWriteAt =
      now;

    writeStoredTimestamp(
      storageKey(
        cleanUserId,
        "last-activity",
      ),
      now,
    );
  }

  async function expireSession(
    reason: SessionExpiryReason,
  ): Promise<void> {
    if (
      !active ||
      expiring
    ) {
      return;
    }

    expiring =
      true;

    clearSessionSecurityState(
      cleanUserId,
    );

    try {
      await supabase.auth.signOut({
        scope: "local",
      });
    } catch (error) {
      console.error(
        "Secure session sign-out failed:",
        error,
      );
    }

    if (active) {
      onExpired(reason);
    }
  }

  function synchroniseActivity(): void {
    const storedLastActivity =
      readStoredTimestamp(
        storageKey(
          cleanUserId,
          "last-activity",
        ),
      );

    if (
      storedLastActivity !== null &&
      storedLastActivity >
        state.lastActivityAt
    ) {
      state.lastActivityAt =
        storedLastActivity;
    }
  }

  function checkSession(): void {
    if (
      !active ||
      expiring
    ) {
      return;
    }

    synchroniseActivity();

    const now =
      Date.now();

    if (
      now -
        state.sessionStartedAt >=
      ABSOLUTE_SESSION_TIMEOUT_MS
    ) {
      void expireSession(
        "maximum-duration",
      );

      return;
    }

    if (
      now -
        state.lastActivityAt >=
      IDLE_TIMEOUT_MS
    ) {
      void expireSession(
        "inactive",
      );
    }
  }

  function handleStorageEvent(
    event: StorageEvent,
  ): void {
    if (
      event.key ===
      storageKey(
        cleanUserId,
        "last-activity",
      )
    ) {
      synchroniseActivity();
      checkSession();
    }
  }

  function handleVisibilityChange():
    void {
    if (
      document.visibilityState ===
      "visible"
    ) {
      synchroniseActivity();
      checkSession();
    }
  }

  const activityEvents: Array<
    keyof WindowEventMap
  > = [
    "pointerdown",
    "keydown",
    "touchstart",
    "scroll",
    "focus",
  ];

  for (
    const eventName of
    activityEvents
  ) {
    window.addEventListener(
      eventName,
      recordActivity,
      {
        passive: true,
      },
    );
  }

  window.addEventListener(
    "storage",
    handleStorageEvent,
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  const intervalId =
    window.setInterval(
      checkSession,
      SESSION_CHECK_INTERVAL_MS,
    );

  checkSession();

  return () => {
    active =
      false;

    window.clearInterval(
      intervalId,
    );

    for (
      const eventName of
      activityEvents
    ) {
      window.removeEventListener(
        eventName,
        recordActivity,
      );
    }

    window.removeEventListener(
      "storage",
      handleStorageEvent,
    );

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
  };
}