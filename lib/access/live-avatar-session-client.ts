"use client";

import {
  evaluateLiveAvatarAccess,
  getLiveAvatarAccessMessage,
  type LiveAvatarAccessDecision,
} from "./live-avatar-access-client";
import {
  finishLiveAvatarUsageSession,
  startLiveAvatarUsageSession,
} from "./live-avatar-usage-client";

export type LiveAvatarSessionState =
  | "idle"
  | "starting"
  | "active"
  | "ending"
  | "blocked"
  | "error";

export type LiveAvatarSession = {
  id: string;
  state: LiveAvatarSessionState;
  startedAt: number | null;
  endedAt: number | null;
  access: LiveAvatarAccessDecision;
  message: string;
};

let activeSession:
  | LiveAvatarSession
  | null = null;

export function getActiveLiveAvatarSession():
  LiveAvatarSession | null {
  return activeSession;
}

export function startLiveAvatarSession():
  LiveAvatarSession {
  const access =
    evaluateLiveAvatarAccess();

  if (!access.allowed) {
    const blockedSession: LiveAvatarSession = {
      id: crypto.randomUUID(),
      state: "blocked",
      startedAt: null,
      endedAt: null,
      access,
      message:
        getLiveAvatarAccessMessage(access),
    };

    activeSession = blockedSession;

    return blockedSession;
  }

  startLiveAvatarUsageSession();

  const startedSession: LiveAvatarSession = {
    id: crypto.randomUUID(),
    state: "active",
    startedAt: Date.now(),
    endedAt: null,
    access,
    message:
      getLiveAvatarAccessMessage(access),
  };

  activeSession = startedSession;

  return startedSession;
}

export function finishLiveAvatarSession():
  LiveAvatarSession | null {
  if (
    !activeSession ||
    activeSession.state !== "active" ||
    activeSession.startedAt === null
  ) {
    return activeSession;
  }

  const endedAt = Date.now();

  const durationSeconds = Math.max(
    0,
    Math.round(
      (endedAt - activeSession.startedAt) /
        1000,
    ),
  );

  finishLiveAvatarUsageSession(
    durationSeconds,
  );

  const finishedSession: LiveAvatarSession = {
    ...activeSession,
    state: "idle",
    endedAt,
    message:
      "Live face-to-face Kimi session ended.",
  };

  activeSession = null;

  return finishedSession;
}

export function failLiveAvatarSession(
  message =
    "The live-avatar session could not continue.",
): LiveAvatarSession | null {
  if (
    !activeSession ||
    activeSession.state !== "active" ||
    activeSession.startedAt === null
  ) {
    return activeSession;
  }

  const endedAt = Date.now();

  const durationSeconds = Math.max(
    0,
    Math.round(
      (endedAt - activeSession.startedAt) /
        1000,
    ),
  );

  finishLiveAvatarUsageSession(
    durationSeconds,
  );

  const failedSession: LiveAvatarSession = {
    ...activeSession,
    state: "error",
    endedAt,
    message,
  };

  activeSession = null;

  return failedSession;
}