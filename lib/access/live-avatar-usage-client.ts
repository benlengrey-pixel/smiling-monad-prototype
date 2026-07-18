"use client";

const LIVE_AVATAR_USAGE_STORAGE_KEY =
  "smiling-monad-live-avatar-usage-v1";

export type LiveAvatarUsage = {
  monthKey: string;
  usedSeconds: number;
  activeSessions: number;
};

function getCurrentMonthKey(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function createEmptyUsage(): LiveAvatarUsage {
  return {
    monthKey: getCurrentMonthKey(),
    usedSeconds: 0,
    activeSessions: 0,
  };
}

function isLiveAvatarUsage(
  value: unknown,
): value is LiveAvatarUsage {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const usage =
    value as Partial<LiveAvatarUsage>;

  return (
    typeof usage.monthKey === "string" &&
    typeof usage.usedSeconds === "number" &&
    Number.isFinite(usage.usedSeconds) &&
    usage.usedSeconds >= 0 &&
    typeof usage.activeSessions === "number" &&
    Number.isInteger(usage.activeSessions) &&
    usage.activeSessions >= 0
  );
}

function saveUsage(
  usage: LiveAvatarUsage,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LIVE_AVATAR_USAGE_STORAGE_KEY,
      JSON.stringify(usage),
    );
  } catch {
    // Usage tracking will later move to the server.
  }
}

export function readLiveAvatarUsage():
  LiveAvatarUsage {
  if (typeof window === "undefined") {
    return createEmptyUsage();
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        LIVE_AVATAR_USAGE_STORAGE_KEY,
      );

    if (!storedValue) {
      return createEmptyUsage();
    }

    const parsedValue =
      JSON.parse(storedValue) as unknown;

    if (!isLiveAvatarUsage(parsedValue)) {
      return createEmptyUsage();
    }

    if (
      parsedValue.monthKey !==
      getCurrentMonthKey()
    ) {
      const resetUsage = createEmptyUsage();
      saveUsage(resetUsage);

      return resetUsage;
    }

    return parsedValue;
  } catch {
    return createEmptyUsage();
  }
}

export function startLiveAvatarUsageSession():
  LiveAvatarUsage {
  const currentUsage =
    readLiveAvatarUsage();

  const nextUsage: LiveAvatarUsage = {
    ...currentUsage,
    activeSessions:
      currentUsage.activeSessions + 1,
  };

  saveUsage(nextUsage);

  return nextUsage;
}

export function finishLiveAvatarUsageSession(
  durationSeconds: number,
): LiveAvatarUsage {
  const currentUsage =
    readLiveAvatarUsage();

  const safeDuration =
    Number.isFinite(durationSeconds)
      ? Math.max(
          0,
          Math.round(durationSeconds),
        )
      : 0;

  const nextUsage: LiveAvatarUsage = {
    ...currentUsage,
    usedSeconds:
      currentUsage.usedSeconds +
      safeDuration,
    activeSessions: Math.max(
      0,
      currentUsage.activeSessions - 1,
    ),
  };

  saveUsage(nextUsage);

  return nextUsage;
}

export function getUsedLiveAvatarMinutes(
  usage: LiveAvatarUsage,
): number {
  return usage.usedSeconds / 60;
}